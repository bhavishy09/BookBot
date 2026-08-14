from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import ChatRequest, ChatResponse
from services import gemini_client

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Chat endpoint — sends a user message to the Gemini-powered booking assistant
    and returns the assistant's reply.

    If the Gemini API key is not configured, returns a friendly error message
    instead of a 500 error.
    """
    try:
        response = await gemini_client.process_message(
            db=db,
            session_id=body.session_id,
            user_message=body.message,
        )
        return response
    except Exception as e:
        # Catch any unexpected errors and return a friendly message
        return ChatResponse(
            session_id=body.session_id,
            reply=f"I'm sorry, something went wrong on my end. Please try again. (Error: {str(e)})",
            pending_action=None,
        )
