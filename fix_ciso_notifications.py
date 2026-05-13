#!/usr/bin/env python3

import re

# Read the file
with open('FC/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the pattern to match the problematic section
pattern = r'(\s+)qs = Notification\.objects\.filter\(user=session_user\)\n\n(\s+)if role_filter and role_filter\.lower\(\) != "all":\n(\s+)role_groups = \{\n(\s+)"approver": \["Approver", "APPROVER"\],\n(\s+)"faculty": \["Faculty", "FACULTY"\],\n(\s+)"ciso": \["CISO"\],\n(\s+)"assistant": \["Assistant"\],\n(\s+)"ovphe": \["OVPHE"\],\n(\s+)"system": \["System"\],\n(\s+)\}   \n(\s+)allowed = role_groups\.get\(role_filter\.lower\(\), \[role_filter\]\)\n(\s+)qs = qs\.filter\(user_role__in=allowed\)'

# Define the replacement
replacement = r'\1# For mark-as-read, filter by role if provided, otherwise current user\n\2if role_filter and role_filter.lower() != "all":\n\3    role_groups = {\n\4        "approver": ["Approver", "APPROVER"],\n\5        "faculty": ["Faculty", "FACULTY"],\n\6        "ciso": ["CISO"],\n\7        "assistant": ["Assistant"],\n\8        "ovphe": ["OVPHE"],\n\9        "system": ["System"],\n\10    }   \n\11    allowed = role_groups.get(role_filter.lower(), [role_filter])\n\12    qs = Notification.objects.filter(user_role__in=allowed)\n\13else:\n\13    qs = Notification.objects.filter(user=session_user)'

# Apply the fix
new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Write back if changed
if new_content != content:
    with open('FC/views.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed CISO notifications mark-as-read issue")
else:
    print("Pattern not found - manual fix needed")
