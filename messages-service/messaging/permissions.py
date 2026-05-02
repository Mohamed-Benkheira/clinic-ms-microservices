ALLOWED_PAIRS = {
    "admin":        ["admin", "receptionist", "doctor"],
    "receptionist": ["admin", "receptionist", "doctor", "patient"],
    "doctor":       ["admin", "receptionist", "doctor"],
    "patient":      ["receptionist"],
}

def can_converse(role_a: str, role_b: str) -> bool:
    return role_b in ALLOWED_PAIRS.get(role_a, [])

def can_start_conversation(role: str) -> bool:
    return role in ["receptionist", "admin"]