---
description: How to test the Cognitive Digital Twin features (Phase 3)
---

# Testing Cognitive Digital Twin Features

This workflow guides you through testing the Adaptive Intelligence, Proactive Insights, and Learning Velocity features.

## 1. Verify Profile Data
Check what the AI currently knows about the user:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/cognitive/profile?productUserId=<YOUR_PRODUCT_USER_ID>"
$response.profile | ConvertTo-Json -Depth 3
```

## 2. Test Welcome Message
1. Navigate to the dashboard: `http://localhost:3000/p/<slug>/dashboard`
2. Click "New Chat" or clear the current session URL parameter.
3. You should see a **personalized welcome message** greeting you by name and offering context-relevant quick actions (e.g., "Review GST filing").

## 3. Trigger Proactive Insights
1. Start a chat about a specific topic (e.g., "How do I file GSTR-1?").
2. The system will detect your goal and potential entities.
3. Refresh the page or start a new session.
4. A **floating insight card** should appear suggesting a follow-up or related action (e.g., "GST Filing Deadline approaches").

## 4. Test Learning Velocity
1. Ask beginner questions about a topic (e.g., "What is GST?").
2. The AI will treat you as a beginner (simple language, analogies).
3. Then, ask detailed technical questions (e.g., "Explain the ITC reversal based on Rule 42").
4. The AI will detect your rapid learning/expertise.
5. In the next response, it should shift to **Expert Mode** (concise, technical terms, no analogies).
6. Check the profile API again to see `learningVelocity` updates.

## 5. Verify Emotional Adaptation
1. Say something frustrated: "This is so confusing! I don't understand why it failed!"
2. The AI response should start with empathy: "I understand this is frustrating..." and simplify the explanation.
3. Say something urgent: "I need this done by 5 PM today!"
4. The AI respons should be brief and action-oriented: "Here is the quickest way to solve this..."
