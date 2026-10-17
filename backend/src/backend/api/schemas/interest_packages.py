from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SuggestedConstraints(BaseModel):
    model_config = ConfigDict(extra="allow")

    max_visit_minutes: int | None = None
    categories: list[str] | None = None
    min_family_friendly: int | None = None
    is_indoor: bool | None = None
    min_rain_suitable: int | None = None


class InterestPackageOut(BaseModel):
    id: str
    label_pl: str
    description_pl: str
    persona: list[Literal["tourist", "resident"]]
    suggested_constraints: SuggestedConstraints = Field(default_factory=SuggestedConstraints)

    @classmethod
    def parse_list(cls, raw: list[dict[str, Any]]) -> list[InterestPackageOut]:
        return [cls.model_validate(item) for item in raw]
