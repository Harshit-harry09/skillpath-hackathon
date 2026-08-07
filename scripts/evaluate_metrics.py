# updated
import re
import json

# Define ground truth for Role Classification Accuracy
ground_truth_roles = {
    "Senior React Developer": "frontend-developer",
    "Node.js Backend Engineer": "backend-developer",
    "iOS Swift Developer": "mobile-developer",
    "DevOps Site Reliability Engineer": "devops",
    "Machine Learning Scientist": "ai-researcher",
    "Data Analyst": "data-professional",
    "Product Owner": "product-manager",
    "Chief Marketing Officer": "marketing",
    "HR Talent Acquisition Lead": "recruiter",
    "Blockchain Solidity Dev": "blockchain-developer",
    "Financial Planning Analyst": "finance",
    "Legal Counsel": "legal",
    "Graphic UX Designer": "designer",
    "Cloud Solutions Architect": "solutions-architect",
    "Penetration Tester": "cybersecurity"
}

# The NEW classify_role logic from train_mvc_model_v2.py
def classify_role(t):
    t = str(t).lower()
    # 1. Highly Specific Niche Roles
    if any(k in t for k in ["machine learning scientist", "ai researcher", "deep learning", "llm researcher"]): return "ai-researcher"
    if any(k in t for k in ["machine learning engineer", "mle"]): return "ml-engineer"
    if any(k in t for k in ["talent acquisition", "recruiter"]): return "recruiter"
    if any(k in t for k in ["growth hacker", "growth engineer"]): return "growth-hacker"
    if any(k in t for k in ["solutions architect", "cloud architect"]): return "solutions-architect"
    if any(k in t for k in ["blockchain", "solidity", "web3", "crypto"]): return "blockchain-developer"
    if any(k in t for k in ["game", "unity", "unreal"]): return "game-developer"
    if any(k in t for k in ["cyber", "security", "infosec", "penetration"]): return "cybersecurity"

    # 2. Specialized Engineering
    if any(k in t for k in ["mobile", "ios", "android", "swift", "kotlin"]): return "mobile-developer"
    if any(k in t for k in ["frontend", "front-end", "react", "next.js"]): return "frontend-developer"
    if any(k in t for k in ["backend", "back-end", "node.js", "go engineer"]): return "backend-developer"
    if any(k in t for k in ["devops", "sre", "site reliability"]): return "devops"
    if any(k in t for k in ["qa", "quality assurance", "test engineer", "automation"]): return "qa-engineer"
    if any(k in t for k in ["embedded", "firmware", "microcontroller"]): return "embedded-systems"
    if any(k in t for k in ["cloud", "infrastructure", "aws", "azure"]): return "cloud-infra"
    if any(k in t for k in ["data engineer", "etl", "data pipeline"]): return "data-engineer"

    # 3. Specialized Business / Management
    if any(k in t for k in ["product manager", "product owner"]): return "product-manager"
    if any(k in t for k in ["scrum master", "agile coach"]): return "scrum-master"
    if any(k in t for k in ["project manager", "pmp"]): return "project-manager"
    if any(k in t for k in ["operations manager", "operations lead"]): return "operations-manager"
    if any(k in t for k in ["business analyst"]): return "business-analyst"
    if any(k in t for k in ["financial planning", "finance", "accounting", "fp&a", "analyst finance"]): return "finance"
    
    # 4. Broader Categories
    if any(k in t for k in ["data analyst", "data scientist", "machine learning"]): return "data-professional"
    if any(k in t for k in ["sales", "account executive", "sdr", "bdr"]): return "sales"
    if any(k in t for k in ["marketing", "growth", "seo", "ppc"]): return "marketing"
    if any(k in t for k in ["consultant", "consulting", "strategy analyst"]): return "consultant"
    if any(k in t for k in ["customer success", "account manager"]): return "customer-success"

    # 5. General Corporate / Creative
    if any(k in t for k in ["hr", "human resources", "people operations"]): return "hr"
    if any(k in t for k in ["legal", "lawyer", "counsel", "compliance"]): return "legal"
    if any(k in t for k in ["designer", "ux", "ui"]): return "designer"
    if any(k in t for k in ["content creator", "video editor", "copywriter"]): return "content-creator"
    if any(k in t for k in ["technical writer", "documentation engineer"]): return "technical-writer"
    if any(k in t for k in ["supply chain", "logistics"]): return "supply-chain"
    if any(k in t for k in ["healthcare analyst", "clinical analyst"]): return "healthcare-analyst"
    if any(k in t for k in ["social media manager"]): return "social-media-manager"

    # 6. Generic Fallback
    if any(k in t for k in ["software", "developer", "engineer"]): return "software-engineer"

    return "other"

correct = 0
for title, expected in ground_truth_roles.items():
    pred = classify_role(title)
    if pred == expected:
        correct += 1
    else:
        print(f"MISMATCH: {title} -> {pred} (Expected: {expected})")

print(f"Updated Role Classification Accuracy: {(correct/len(ground_truth_roles))*100:.2f}%")
