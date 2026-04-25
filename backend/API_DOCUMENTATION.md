# RankWise API Documentation

This document outlines the available REST API endpoints for the RankWise backend.

## 1. Authentication Routes
**Base Path:** `/auth`

These endpoints manage user registration, authentication, and password resets.

*   **`POST /auth/signup`**: Register a new user account.
*   **`POST /auth/login`**: Authenticate a user and receive a token/session.
*   **`POST /auth/confirm`**: Confirm a user account via a provided code or token.
*   **`GET /auth/confirm_link/:confirmation_link_id`**: Confirm a user account via a direct link.
*   **`POST /auth/forgot`**: Initiate the forgotten password flow by requesting a verification code.
*   **`POST /auth/verify`**: Verify the password reset code.
*   **`POST /auth/reset`**: Reset the password after successful verification.

## 2. Dashboard & Core Operations
**Base Path:** `/`

These endpoints require authentication (`middleAuth` middleware) and handle the core functionalities of the RankWise system, including candidate registration and shortlisting.

*   **`GET /dashboard`**: Retrieve the user's dashboard data (e.g., jobs, recent activity).
*   **`POST /register-candidate`**: Upload and register candidates. 
    *   *Accepts multipart/form-data:* Expects `applicants_spreadsheet` (.xlsx or .csv) and/or `resume_pdf_zip` (.zip containing PDFs).
*   **`POST /ask`**: Ask Gemini questions based on the candidate data.
*   **`POST /complete-job`**: Mark a specific job posting or screening task as completed.
*   **`POST /review-result`**: Review and update the verdict (e.g., shortlist status) of screened applicants.
*   **`POST /sendEmails`**: Trigger emails to shortlisted or rejected candidates.

## 3. AI Screening Services
**Base Path:** `/ai`

These endpoints integrate with Google's Generative AI (Gemini/Vertex AI) to analyze and rank candidates.

*   **`GET /ai/models`**: List the available Generative AI models.
*   **`POST /ai/run`**: Initiate a new AI screening run for a specific job and set of applicants.
*   **`GET /ai/runs`**: Retrieve a list of past and ongoing AI screening runs.
*   **`GET /ai/runs/:runId`**: Retrieve the detailed results of a specific AI screening run, including candidate rankings and match scores.
*   **`POST /ai/ask`**: Ask the AI assistant questions about specific candidates or job requirements.
