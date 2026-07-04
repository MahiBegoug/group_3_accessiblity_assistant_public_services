"""Persistence Layer.

Owns the data model and access logic for the Montreal public places dataset.
Converts raw CSV rows into structured ``Place`` entities and exposes repository
methods so the Business Layer never touches raw CSV handling.
"""
