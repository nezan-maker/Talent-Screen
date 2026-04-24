import re

with open("backend/src/controllers/applicantControl.ts", "r") as f:
    content = f.read()

# Fix current_json type
content = content.replace("const current_json: Applicant_ = application_data[i];", "const current_json: any = application_data[i];")
content = content.replace("const current_json: Applicant_ = file_content_json[i];", "const current_json: any = file_content_json[i];")

with open("backend/src/controllers/applicantControl.ts", "w") as f:
    f.write(content)

