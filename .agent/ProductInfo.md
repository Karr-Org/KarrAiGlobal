# KarrAi Global - Product Factory Architecture

## 1. Universal Auth & Routing Logic
ALL products created in this system must strictly follow this URL and Authentication pattern. No exceptions.

### **URL Structure**
For every product (e.g., `indiangstai.com`, `legaltax.com`), the visible URLs must ALWAYS be clean:

| Page Type | User-Facing URL | Internal Path (Hidden) | Description |
|-----------|----------------|------------------------|-------------|
| **Landing** | `domain.com/` | `/p/[slug]/page.tsx` | Public marketing page. CTA buttons link to `/signin` or `/signup`. **NO CHAT HERE.** |
| **Sign In** | `domain.com/signin` | `/p/[slug]/signin/page.tsx` | Dedicated login form. Redirects to `/dashboard` on success. |
| **Sign Up** | `domain.com/signup` | `/p/[slug]/signup/page.tsx` | Dedicated registration form. Redirects to `/dashboard` on success. |
| **App** | `domain.com/dashboard` | `/p/[slug]/dashboard/page.tsx` | **Protected**. The actual functional chat/tool. Redirects to `/signin` if not active. |

### **Middleware Rules**
The `middleware.ts` handles the mapping automatically:
1.  User visits `custom-domain.com/path`
2.  Middleware checks DB for matching Product Slug
3.  Middleware rewrites request to `karrai-global.vercel.app/p/[slug]/path`
4.  User sees `custom-domain.com/path` (URL stays clean)

## 2. Multi-Tenant Data Isolation
- **Users**: A single user account (`auth.users`) is linked to a specific product via `product_users` table.
- **Data**: User documents and chats are siloed.
    - `product_users` table links User <-> Product.
    - `user_knowledge_bases` links to `product_users`.
    - **Rule:** A user on Product A CANNOT see data from Product B, even if they use the same email.

## 3. Adding a New Product
To launch a new SaaS (e.g., "US Immigration AI"):
1.  **Database**: Insert row into `products` table (Name, Slug=`us-immigration`, Domain=`usimmigration.ai`).
2.  **Vercel**: Add `usimmigration.ai` to Vercel Project Domains.
3.  **Done**: The site is live at `usimmigration.ai` with full Auth, RAG, and Dashboard automatically working.
