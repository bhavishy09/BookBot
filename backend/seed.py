"""
Seed script — creates a sample admin user and a few services
so the app isn't completely empty on first run.
Run:  python seed.py
"""
from database import SessionLocal, engine, Base
from models import Service, AdminUser
from passlib.hash import bcrypt

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Seed services if empty
if db.query(Service).count() == 0:
    services = [
        Service(name="Haircut", duration_minutes=30),
        Service(name="Hair Coloring", duration_minutes=60),
        Service(name="Beard Trim", duration_minutes=15),
        Service(name="Facial", duration_minutes=45),
        Service(name="Massage", duration_minutes=60),
    ]
    db.add_all(services)
    print("Seeded 5 services.")

# Seed admin or update existing default admin
admin = db.query(AdminUser).filter(AdminUser.email.in_(["admin@example.com", "admin@bookbot.com"])).first()
if not admin:
    admin = AdminUser(
        email="admin@bookbot.com",
        password_hash=bcrypt.hash("BookBot#Admin2026!Secure"),
    )
    db.add(admin)
    print("Seeded strong admin user (admin@bookbot.com / BookBot#Admin2026!Secure).")
else:
    admin.email = "admin@bookbot.com"
    admin.password_hash = bcrypt.hash("BookBot#Admin2026!Secure")
    print("Updated admin user credentials to (admin@bookbot.com / BookBot#Admin2026!Secure).")

db.commit()
db.close()
print("Done.")
