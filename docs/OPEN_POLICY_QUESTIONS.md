# SRGC Student Result Management System — Open Institutional Policy Questions

This document registers all academic policies, administrative rules, and institutional branding elements that require explicit institutional confirmation from Shri Ram Group of Colleges (SRGC).

In adherence to the **Permanent Engineering Rules (GEMINI.md)**:
> *"Never invent SRGC's grading policy, accreditation, affiliations, rankings, seals, or signatures. Unknown policy becomes a configurable setting and an entry in docs/OPEN_POLICY_QUESTIONS.md. Branding (name, logo, address, contacts, session) is configurable by the admin."*

Every item listed below is implemented in code as a **configurable parameter** in `InstitutionSetting`, `GradingScale`, `GradeRule`, or `ResultCalculationPolicy`. Default values represent standard academic conventions and can be overridden by an institutional administrator.

---

## 1. Grading Scale & Letter Grade Definitions

| Policy Item | Current Configurable Default | Questions / Institutional Confirmation Needed |
| :--- | :--- | :--- |
| **Grading System** | 10-Point UGC / AICTE Relative & Absolute Scale | Does SRGC use a 10-point scale (O, A+, A, B+, B, C, P, F) or a percentage-based division scale (1st Div with Distinction, 1st Div, 2nd Div, Pass, Fail)? |
| **Minimum Passing Grade Point** | 4.0 (Letter Grade 'P') | What is the minimum grade point required to earn subject credits (e.g., 4.0 or 5.0)? |
| **Grade Boundary Rounding** | Round half up (e.g., 74.5% rounds to 75%) | Are percentage boundaries rounded before assigning letter grades, or truncated? |
| **Grace Marks Policy** | Disabled by default; max 3 grace marks if enabled | Does SRGC allow grace marks for borderline fails? If yes, what is the maximum per subject / semester? |

---

## 2. Passing Criteria & Promotion Rules

| Policy Item | Current Configurable Default | Questions / Institutional Confirmation Needed |
| :--- | :--- | :--- |
| **Theory Passing Threshold** | 40% of Maximum Theory Marks | Is the minimum passing percentage for internal/external theory 40% or 50%? |
| **Practical Passing Threshold**| 50% of Maximum Practical Marks | Is practical assessment evaluated independently with a higher threshold? |
| **Aggregate Passing Threshold**| 40% combined score | Must a student pass theory and practical separately, or only in aggregate? |
| **Carry-over / Backlog Limit**  | Max 4 backlog subjects allowed for promotion | What is the maximum backlog allowance before a student is detained from progressing to the next semester? |

---

## 3. SGPA & CGPA Calculation Formulas

| Policy Item | Current Configurable Default | Questions / Institutional Confirmation Needed |
| :--- | :--- | :--- |
| **SGPA Formula** | $\frac{\sum (\text{Credits}_i \times \text{GradePoint}_i)}{\sum \text{Credits}_i}$ | Standard weighted credit formula. Are non-credit audit courses excluded from the denominator? (Currently excluded). |
| **CGPA Formula** | Cumulative weighted average across all completed semesters | Standard cumulative credit formula. How are re-appear / improved grades factored into historical CGPA? |
| **Percentage Conversion** | $\text{Percentage} = \text{CGPA} \times 9.5$ or $\text{CGPA} \times 10.0$ | Which conversion factor is officially endorsed by SRGC's affiliating university (e.g., AKTU / CCSU / other)? |

---

## 4. Privacy, Ranking & Student Visibility

| Policy Item | Current Configurable Default | Questions / Institutional Confirmation Needed |
| :--- | :--- | :--- |
| **Student Ranking Visibility**| Hidden from student portal by default (visible only to admin) | Does SRGC policy allow students to view their class/batch ranks, or is rank withheld for student well-being? |
| **Withheld Marks Handling**   | Marked "WITHHELD - CONTACT EXAMINATION CELL" | For fee dues, attendance shortage, or disciplinary review, should students see partial marks or a full withheld screen? |
| **Re-evaluation / Scrutiny**  | Configurable re-evaluation request window | Does SRGC support online re-evaluation requests via the portal, or strictly offline submission? |

---

## 5. Institutional Branding & Transcripts

| Policy Item | Current Configurable Default | Questions / Institutional Confirmation Needed |
| :--- | :--- | :--- |
| **Affiliation & Accreditation**| Configurable placeholder text in admin settings | What is the exact affiliating university text (e.g., "Affiliated to Dr. A.P.J. Abdul Kalam Technical University, Lucknow" or "CCSU Meerut")? |
| **Official Signatories**       | "Controller of Examinations" & "Registrar" | Whose titles and digital signatures should be designated on official PDF result cards? |
| **Campus Addresses & Codes**   | Admin-configurable in `InstitutionSetting` | Exact college codes, address, contact telephone numbers, and official inquiry email addresses. |

