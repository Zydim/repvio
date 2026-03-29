import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from models.database import AnalysisSession, User, PLAN_LIMITS, get_db
from services.claude_service import analyze_exercise

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mov"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
TMP_DIR = Path("/tmp/repvio")


def _check_and_increment_limit(user: User, db: Session):
    """Reset monthly counter if needed, then check and increment."""
    now = datetime.utcnow()
    # Reset counter if we're in a new month
    if (now.year, now.month) > (user.analyses_reset_at.year, user.analyses_reset_at.month):
        user.analyses_this_month = 0
        user.analyses_reset_at = now

    limit = PLAN_LIMITS.get(user.plan)
    if limit is not None and user.analyses_this_month >= limit:
        plan_label = "Free" if user.plan == "free" else user.plan.capitalize()
        raise HTTPException(
            status_code=403,
            detail=f"Monatliches Limit erreicht ({limit} Analysen im {plan_label}-Plan). Bitte upgraden.",
        )

    user.analyses_this_month += 1
    db.commit()


@router.post("/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    exercise_type: str = Form(...),
    user_email: str = Form(default="anonymous@repvio.app"),
    muscle_focus: str = Form(default=""),
    db: Session = Depends(get_db),
):
    # Validate file extension
    suffix = Path(video.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültiges Dateiformat. Erlaubt: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file and check size
    contents = await video.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Datei zu groß. Maximum: 100 MB")

    # Check plan limit
    user = db.query(User).filter(User.email == user_email).first()
    if user:
        _check_and_increment_limit(user, db)

    # Save temporarily
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{video.filename}"
    tmp_path = TMP_DIR / safe_filename

    try:
        with open(tmp_path, "wb") as f:
            f.write(contents)

        # Analyze with Claude
        feedback = await analyze_exercise(str(tmp_path), exercise_type, muscle_focus or None)

        score = float(feedback.get("score", 0))

        # Save to DB
        session = AnalysisSession(
            user_email=user_email,
            exercise_type=exercise_type,
            video_filename=safe_filename,
            feedback_json=json.dumps(feedback, ensure_ascii=False),
            score=score,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "session_id": session.id,
            "feedback": feedback,
            "score": score,
            "exercise_type": exercise_type,
            "created_at": session.created_at.isoformat(),
        }

    finally:
        if tmp_path.exists():
            tmp_path.unlink()
