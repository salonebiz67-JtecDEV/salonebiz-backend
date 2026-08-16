# 🇸🇱 SaloneBiz Backend

Backend API for the SaloneBiz platform.

SaloneBiz connects customers with local businesses so customers can browse products, place orders, and receive delivery updates.

## Core features

- User accounts
- Business accounts
- Business locations
- Products
- Customer orders
- Accept/reject orders
- Rejection reasons
- Order status
- Delivery estimates
- Delivery countdown
- Notifications

## Payment

SaloneBiz does not process or hold customer payments.

Payments are handled directly between the customer and business.

## Version

0.1.0

So your API structure becomes:
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login

GET    /api/posts/feed
GET    /api/posts/mine
POST   /api/posts
DELETE /api/posts/:id

GET    /api/users/me
GET    /api/users/:id

POST   /api/friends/:userId
GET    /api/friends

POST   /api/interactions/posts/:postId/like
POST   /api/interactions/posts/:postId/favorite
POST   /api/interactions/posts/:postId/share
POST   /api/interactions/posts/:postId/comments

POST   /api/messages
GET    /api/messages

Our app architecture is now
                    SALONEBIZ
                       │
          ┌────────────┴────────────┐
          │                         │
       PUBLIC                    PRIVATE
          │                         │
       Landing                  🔐 Login
       API health               🔐 Home
                                🔐 Friends
                                🔐 Create Post
                                🔐 Inbox
                                🔐 Profile
                                     │
                              ┌──────┴──────┐
                              │             │
                            Image         Social
                            Posts         Actions
                              │             │
                         ❤️ Likes       ⭐ Favorites
                         💬 Comments    ↗️ Shares
                         👤 Profiles     🤝 Friends
