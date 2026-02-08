'use client';

import { PremiumMarkdownRenderer } from '@/components/chat/PremiumMarkdownRenderer';

const demoContent = `
# Premium Markdown Renderer Demo 🎨

This page demonstrates all the features of the new world-class markdown renderer.

## 1. Basic Formatting

**Bold text** and *italic text* and \`inline code\`.

> This is a blockquote with **formatted** content inside.

---

## 2. Lists

* First bullet point
* Second bullet point with **bold**
* Third bullet point with \`code\`

1. First numbered item
2. Second numbered item
3. Third numbered item

### Task Lists
- [x] Completed task
- [ ] Pending task
- [x] Another done task

---

## 3. Code Blocks with Syntax Highlighting

### JavaScript
\`\`\`javascript
function calculateCompoundInterest(principal, rate, time, n) {
    // A = P(1 + r/n)^(nt)
    const amount = principal * Math.pow(1 + rate / n, n * time);
    return amount.toFixed(2);
}

console.log(calculateCompoundInterest(1000, 0.05, 5, 12));
\`\`\`

### Python
\`\`\`python
def compound_interest(principal, rate, time, n=12):
    """Calculate compound interest with given parameters."""
    amount = principal * (1 + rate / n) ** (n * time)
    return round(amount, 2)

result = compound_interest(1000, 0.05, 5)
print(f"Final amount: ${'$'}{result}")
\`\`\`

### TypeScript
\`\`\`typescript
interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
}

async function fetchUser(id: string): Promise<User> {
    const response = await fetch(\`/api/users/\${id}\`);
    return response.json();
}
\`\`\`

### SQL
\`\`\`sql
SELECT 
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 10;
\`\`\`

---

## 4. Mathematics (LaTeX/KaTeX)

The quadratic formula is:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Inline math works too: The equation $E = mc^2$ shows mass-energy equivalence.

### More Complex Math

The Gaussian integral:
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

Maxwell's equations in differential form:
$$\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}$$

---

## 5. Tables (GFM)

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown rendering | ✅ Done | High |
| Code highlighting | ✅ Done | High |
| Math equations | ✅ Done | Medium |
| Mermaid diagrams | ✅ Done | Medium |
| Animations | ✅ Done | Low |

---

## 6. Mermaid Diagrams

### Flowchart
\`\`\`mermaid
graph TD
    A[User Query] --> B{Valid?}
    B -->|Yes| C[Search KB]
    B -->|No| D[Ask Clarification]
    C --> E{Found Results?}
    E -->|Yes| F[Generate Response]
    E -->|No| G[Web Search]
    G --> F
    F --> H[Return Answer]
\`\`\`

---

## 7. Callouts

Note: This is an informational note that provides additional context.

Tip: Pro tip - you can use keyboard shortcuts for faster navigation!

Warning: Be careful with this operation, it cannot be undone.

---

## 8. Links and Citations

Check out the [official documentation](https://example.com) for more details.

This information comes from multiple sources [Source 1, 2, 3].

---

## 9. Mixed Content

Here's a practical example combining multiple features:

The **Pythagorean theorem** states that $a^2 + b^2 = c^2$.

\`\`\`python
import math

def calculate_hypotenuse(a: float, b: float) -> float:
    """Calculate the hypotenuse using the Pythagorean theorem."""
    return math.sqrt(a**2 + b**2)

# Example usage
result = calculate_hypotenuse(3, 4)
print(f"Hypotenuse: ${'{' + 'result' + '}'}")  # Output: 5.0
\`\`\`

This demonstrates how code, math, and formatting work together seamlessly!
`;

export default function MarkdownDemoPage() {
    return (
        <div className="min-h-screen bg-sand-50 py-12">
            <div className="max-w-3xl mx-auto px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-sand-900 mb-2">
                        🎨 Premium Markdown Renderer
                    </h1>
                    <p className="text-sand-600">
                        World-class AI response rendering with code highlighting, math, diagrams & more
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-8">
                    <PremiumMarkdownRenderer
                        content={demoContent}
                        brandColor="#DA7B4D"
                    />
                </div>
            </div>
        </div>
    );
}
