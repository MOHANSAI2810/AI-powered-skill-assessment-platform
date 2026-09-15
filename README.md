# AI Powered Skill Assessment Platform

A web application for taking multiple-choice skill assessments across technical and aptitude subjects. Candidates enter their name and email, complete a 20-question quiz, see instant answer feedback, and view saved results on a personal dashboard.

## Features

- Name and email entry (no password-based auth)
- Nine subjects: C#, .NET, React, Angular, JavaScript, Reasoning, Aptitude, English, CS Fundamentals
- Each assessment loads **20 random questions** from that subject’s question bank
- Answers are scored on the server (correct option IDs are not sent to the browser)
- Immediate correct / incorrect feedback after each question
- Results saved to MySQL with marks, percentage, and remarks
- Dashboard with completed assessments, average percentage, and history

Remarks are assigned from the percentage:

| Percentage | Remarks            |
| ---------- | ------------------ |
| 90+        | Excellent          |
| 80–89      | Very Good          |
| 70–79      | Good               |
| 60–69      | Average            |
| Below 60   | Needs Improvement  |

## Tech stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS                    |
| Backend  | ASP.NET Core (`net10.0`)                        |
| Database | MySQL (Entity Framework Core + Pomelo provider) |
| Data     | JSON question banks in `backend/SkillAssessment.Api/Questions` |

## Project structure

```
.
├── backend/SkillAssessment.Api/     # ASP.NET Core API
│   ├── Controllers/
│   ├── Data/                        # EF Core DbContext
│   ├── Models/
│   ├── Questions/                   # Per-subject JSON banks
│   ├── Migrations/
│   └── appsettings.json             # MySQL connection string
└── frontend/skill-assessment-ui/    # React UI
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (LTS recommended)
- MySQL 8 running locally

## Database setup

1. Create the database:

```sql
CREATE DATABASE skill_assessment_db;
```

2. Update the connection string in `backend/SkillAssessment.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=skill_assessment_db;User=root;Password=YOUR_PASSWORD;"
}
```

3. Apply migrations from the API project folder:

```bash
cd backend/SkillAssessment.Api
dotnet ef database update
```

If the `dotnet-ef` tool is not installed:

```bash
dotnet tool install --global dotnet-ef
```

## Run the backend

```bash
cd backend/SkillAssessment.Api
dotnet run
```

The API listens on **http://localhost:5195**.

## Run the frontend

In a second terminal:

```bash
cd frontend/skill-assessment-ui
npm install
npm run dev
```

Open the URL Vite prints (typically **http://localhost:5173**).

The UI calls the API at `http://localhost:5195/api`. Start the backend before using the app.

## API overview

| Method | Endpoint                         | Description                                      |
| ------ | -------------------------------- | ------------------------------------------------ |
| `GET`  | `/api/questions/{subject}`       | 20 random questions (without correct answers)    |
| `POST` | `/api/questions/check`           | Check a selected option for a question           |
| `GET`  | `/api/assessments?email={email}` | Assessment history for an email                  |
| `POST` | `/api/assessments`               | Save a completed assessment                      |

Valid `subject` values: `csharp`, `dotnet`, `react`, `angular`, `javascript`, `reasoning`, `aptitude`, `english`, `cs-fundamentals`.

### Check answer body

```json
{
  "subject": "react",
  "questionId": 1,
  "selectedOptionId": 2
}
```

### Save assessment body

```json
{
  "emailId": "user@example.com",
  "name": "Jane Doe",
  "course": "React",
  "marks": 16,
  "totalQuestions": 20
}
```

## Question banks

Each file under `backend/SkillAssessment.Api/Questions/` is a JSON array of questions. Example shape:

```json
[
  {
    "id": 1,
    "text": "Question text",
    "correctOptionId": 2,
    "options": [
      { "id": 1, "text": "Option A" },
      { "id": 2, "text": "Option B" }
    ]
  }
]
```

Add or edit questions in those files. Keep `id` values unique within a subject. `correctOptionId` must match an option `id`. The API never returns `correctOptionId` on the GET questions endpoint.

## Typical flow

1. User enters name and email.
2. Dashboard loads previous results for that email.
3. User picks a subject and answers 20 questions.
4. After the last question, the result is saved and shown, then history appears on the dashboard.

## Notes

- Login is identification only (name + email). It does not verify credentials.
- CORS is open for local development (`AllowAnyOrigin`).
- Do not commit real database passwords. Prefer user secrets or environment variables for anything beyond local use.
