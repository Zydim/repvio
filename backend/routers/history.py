import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.database import AnalysisSession, get_db
from utils.auth import verify_user_token

router = APIRouter()


@router.get("/history")
def get_history(
    email: str,
    user_token: str = Query(...),
    db: Session = Depends(get_db),
):
    if not verify_user_token(email, user_token):
        raise HTTPException(status_code=401, detail="Ungültige oder abgelaufene Sitzung.")

    sessions = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_email == email)
        .order_by(AnalysisSession.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for s in sessions:
        feedback = json.loads(s.feedback_json)
        result.append({
            "session_id": s.id,
            "exercise_type": s.exercise_type,
            "score": s.score,
            "overall": feedback.get("overall", ""),
            "created_at": s.created_at.isoformat(),
        })

    return result


@router.get("/history/{session_id}")
def get_session(
    session_id: int,
    email: str = Query(...),
    user_token: str = Query(...),
    db: Session = Depends(get_db),
):
    if not verify_user_token(email, user_token):
        raise HTTPException(status_code=401, detail="Ungültige oder abgelaufene Sitzung.")

    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session nicht gefunden")

    if session.user_email != email:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diese Analyse.")

    feedback = json.loads(session.feedback_json)
    return {
        "session_id": session.id,
        "exercise_type": session.exercise_type,
        "feedback": feedback,
        "score": session.score,
        "created_at": session.created_at.isoformat(),
    }
