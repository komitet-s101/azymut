from __future__ import annotations

from enum import IntEnum

from tortoise import fields, models


class PriceLevel(IntEnum):
    FREE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class Place(models.Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    city = fields.CharField(max_length=128)
    gmina = fields.CharField(max_length=128)
    address_line = fields.CharField(max_length=512, null=True)
    latitude = fields.FloatField()
    longitude = fields.FloatField()
    category = fields.CharField(max_length=64)
    is_indoor = fields.BooleanField()
    is_outdoor = fields.BooleanField()
    adult_only = fields.BooleanField(default=False)
    min_age_recommended = fields.SmallIntField(null=True)
    typical_visit_minutes = fields.IntField()
    price_level = fields.IntEnumField(PriceLevel)
    price_max_pln = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
    gastro_intensity = fields.SmallIntField(default=0)
    game_interactivity = fields.SmallIntField(default=0)
    physical_activity_level = fields.SmallIntField(default=0)
    cultural_education = fields.SmallIntField(default=0)
    nature_relaxation = fields.SmallIntField(default=0)
    family_friendly = fields.SmallIntField(default=0)
    rain_suitable = fields.SmallIntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    opening_hours: fields.ReverseRelation[OpeningHours]
    route_stops: fields.ReverseRelation[RouteStop]

    class Meta:
        table = "place"


class OpeningHours(models.Model):
    id = fields.IntField(pk=True)
    place: fields.ForeignKeyRelation[Place] = fields.ForeignKeyField(
        "models.Place",
        related_name="opening_hours",
        on_delete=fields.CASCADE,
    )
    day_of_week = fields.SmallIntField()
    opens_at = fields.CharField(max_length=5)
    closes_at = fields.CharField(max_length=5)

    class Meta:
        table = "opening_hours"
        indexes = (("place_id", "day_of_week"),)


class PredefinedRoute(models.Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    duration_minutes_approx = fields.IntField()
    stops_min = fields.IntField()
    stops_max = fields.IntField()
    city = fields.CharField(max_length=128)
    gmina = fields.CharField(max_length=128)
    price_level_max = fields.IntEnumField(PriceLevel, null=True)

    stops: fields.ReverseRelation[RouteStop]

    class Meta:
        table = "predefined_route"


class RouteStop(models.Model):
    id = fields.IntField(pk=True)
    route: fields.ForeignKeyRelation[PredefinedRoute] = fields.ForeignKeyField(
        "models.PredefinedRoute",
        related_name="stops",
        on_delete=fields.CASCADE,
    )
    place: fields.ForeignKeyRelation[Place] = fields.ForeignKeyField(
        "models.Place",
        related_name="route_stops",
        on_delete=fields.CASCADE,
    )
    sequence = fields.IntField()
    dwell_minutes = fields.IntField(null=True)

    class Meta:
        table = "route_stop"
        unique_together = (("route_id", "sequence"),)


__all__ = [
    "OpeningHours",
    "Place",
    "PredefinedRoute",
    "PriceLevel",
    "RouteStop",
]
