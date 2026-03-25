import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import AnalysisSession, get_db

router = APIRouter()


@router.get("/history")
def get_history(email: str, db: Session = Depends(get_db)):
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
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session nicht gefunden")

    feedback = json.loads(session.feedback_json)
    return {
        "session_id": session.id,
        "user_email": session.user_email,
        "exercise_type": session.exercise_type,
        "feedback": feedback,
        "score": session.score,
        "created_at": session.created_at.isoformat(),
    }
