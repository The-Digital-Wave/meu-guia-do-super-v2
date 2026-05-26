# Monorepo Agent Orchestrator

## Objective

This root file is the orchestration layer for all domain agents in this monorepo.
It defines who owns each decision, how work is routed, and in which sequence cross-functional tasks must run.

Scope covered:

- agents/devsecops
- agents/product_management
- agents/quality_assurance
- agents/ux_design
- client
- server

## Source of Truth Hierarchy

When instructions conflict, use this precedence order:

1. Task-specific requirements from the user.
2. This root orchestration file.
3. Domain CLAUDE.md files under each folder.
4. Local implementation preferences.

If conflict still exists, stop and ask a clarifying question before implementation.

## Agent Registry

1. Product Management Agent
   Role: Defines what to build and why.
   Owns: backlog quality, user stories, acceptance criteria, prioritization.
   Path: agents/product_management/CLAUDE.md

2. UX Design Agent
   Role: Defines interaction model, visual hierarchy, and design tokens.
   Owns: user flows, component behavior states, accessibility constraints.
   Path: agents/ux_design/CLAUDE.md

3. Server Agent
   Role: Designs and implements backend contracts and services.
   Owns: API contracts, validation, persistence model, auth and authorization logic.
   Path: server/CLAUDE.md

4. Client Agent
   Role: Implements mobile-first frontend behavior and app state.
   Owns: UI implementation, API consumption, loading/error/offline UX states.
   Path: client/CLAUDE.md

5. Quality Assurance Agent
   Role: Validates behavior against requirements and contracts.
   Owns: integration tests, regression tests, negative path coverage, flake prevention.
   Path: agents/quality_assurance/CLAUDE.md

6. DevSecOps Agent
   Role: Guarantees secure, reproducible, and observable delivery pipelines.
   Owns: CI/CD, secrets strategy, security scanning gates, deployment controls.
   Path: agents/devsecops/CLAUDE.md

## Work Routing Matrix

Use this matrix to choose primary ownership and required collaborators.

1. New feature discovery or scope change
   Primary: Product Management
   Collaborators: UX Design, Server, Client, QA

2. User flow or UI redesign
   Primary: UX Design
   Collaborators: Product Management, Client, QA

3. API contract creation or changes
   Primary: Server
   Collaborators: Product Management, Client, QA, DevSecOps

4. Mobile screen/component implementation
   Primary: Client
   Collaborators: UX Design, Server, QA

5. Test strategy, bug reproduction, regression hardening
   Primary: QA
   Collaborators: Product Management, Client, Server

6. Pipeline, security, release, infra, compliance work
   Primary: DevSecOps
   Collaborators: QA, Server, Client

## Default Delivery Sequence

For any medium or large feature, execute in this order:

1. Product Management: define story, constraints, and acceptance criteria.
2. UX Design: define mobile-first flow, states, and tokens impacted.
3. Server: define or update API contract and backend behavior.
4. Client: implement UI plus service integration using agreed contracts.
5. QA: validate happy path, edge cases, and negative/security paths.
6. DevSecOps: enforce quality/security gates and release readiness.

No stage is considered complete without clear handoff artifacts.

## Handoff Contracts

Every agent output must include these sections:

1. Inputs received
2. Decisions made
3. Artifacts created or modified
4. Open risks and assumptions
5. Explicit handoff target agent

Minimum required handoffs:

- Product Management -> UX Design and Server
- UX Design -> Client and QA
- Server -> Client and QA
- Client -> QA
- QA -> DevSecOps and Product Management
- DevSecOps -> Product Management (release readiness)

## Definition of Ready for Engineering

A task is ready for implementation only when all are true:

1. User story has measurable acceptance criteria.
2. UX flow covers loading, empty, success, and error states.
3. API contract is defined for every required integration.
4. Non-functional constraints are explicit (security, performance, offline behavior).

## Definition of Done for Cross-Agent Work

A feature is done only when all are true:

1. Product criteria are met with no ambiguity.
2. UX behavior matches approved flow and accessibility constraints.
3. Client and server are contract-compatible.
4. QA reports passing coverage for happy path, edge, and negative paths.
5. DevSecOps gates pass with no critical security or release blockers.
6. Documentation is updated in the impacted folders.

## Change Management Rules

1. Do not bypass Product Management acceptance criteria.
2. Do not implement UI that diverges from UX state definitions without explicit approval.
3. Do not change API payloads without synchronized client and QA updates.
4. Do not merge pipeline changes that weaken security gates.
5. Any breaking change must include migration and rollback notes.

## Escalation Protocol

Escalate to the user immediately when any of these happen:

1. Requirement conflict between product scope and technical feasibility.
2. API contract disagreement between client and server.
3. Security risk with no acceptable mitigation.
4. Persistent test flakiness blocking release confidence.

## Task Intake Template

Use this template for every new task before implementation:

1. Business objective
2. In-scope surfaces (client, server, infra, tests)
3. Out-of-scope items
4. Affected agents and ownership
5. Acceptance criteria
6. Risks and dependencies

## Execution Policy

1. Prefer small, verifiable increments over large unreviewed changes.
2. Keep all agents aligned to mobile-first assumptions unless explicitly overridden.
3. Validate contracts before coding integrations.
4. Preserve auditability by documenting key decisions in changed files.

## Quick Start Routing

If unsure where to start:

1. Start at Product Management for unclear feature intent.
2. Start at UX Design for unclear interaction or state behavior.
3. Start at Server for unknown data model or API constraints.
4. Start at Client for implementation-only UI tasks with stable contracts.
5. Start at QA for bug reproduction and release confidence checks.
6. Start at DevSecOps for deployment, security, or environment reliability.

## Execution Examples

### 1. New Feature Flow

1. Product Management writes the user story with measurable acceptance criteria and MoSCoW priority.
2. UX Design defines mobile-first flow plus loading, empty, success, and error states.
3. Server drafts or updates API contract and backend implementation plan.
4. Client implements screens, state handling, and API integration against the agreed contract.
5. QA validates happy path, edge cases, and negative/security behavior.
6. DevSecOps enforces CI/CD and security gates before release approval.

Handoff chain:
Product Management -> UX Design + Server -> Client -> QA -> DevSecOps -> Product Management

### 2. Bugfix Flow

1. QA reproduces the issue with deterministic steps and expected vs actual behavior.
2. Product Management classifies severity and confirms target behavior.
3. Server and/or Client implement the minimal safe fix, preserving contract compatibility.
4. QA executes regression tests around the impacted flow and adjacent critical paths.
5. DevSecOps ensures pipelines and checks pass before merge/release.

Handoff chain:
QA -> Product Management -> Server/Client -> QA -> DevSecOps

### 3. Security Incident Flow

1. DevSecOps triages the incident, assigns severity, and starts containment actions.
2. Server and Client apply remediations (for example auth hardening, input validation, secret rotation usage).
3. QA runs targeted abuse/negative-path validation for the affected surfaces.
4. DevSecOps re-runs security scans, verifies mitigation, and confirms release gates.
5. Product Management receives incident summary, impact, and communication-ready status.

Handoff chain:
DevSecOps -> Server + Client -> QA -> DevSecOps -> Product Management
