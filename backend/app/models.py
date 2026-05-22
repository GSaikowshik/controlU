import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    generation_tier: Mapped[str] = mapped_column(String(50), nullable=False)
    aura_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    
    # Relationships
    urge_categories: Mapped[list["UrgeCategory"]] = relationship(
        "UrgeCategory", back_populates="user", cascade="all, delete-orphan"
    )
    intervention_logs: Mapped[list["InterventionLog"]] = relationship(
        "InterventionLog", back_populates="user", cascade="all, delete-orphan"
    )

class UrgeCategory(Base):
    __tablename__ = "urge_categories"
    
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="urge_categories")
    intervention_logs: Mapped[list["InterventionLog"]] = relationship(
        "InterventionLog", back_populates="category", cascade="all, delete-orphan"
    )

class InterventionLog(Base):
    __tablename__ = "intervention_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("urge_categories.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    completed_full_session: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="intervention_logs")
    category: Mapped["UrgeCategory"] = relationship("UrgeCategory", back_populates="intervention_logs")
