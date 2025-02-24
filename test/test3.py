from github import Github
import os
from github import Auth

token = os.getenv('GITHUB_TOKEN')

g = Github(token)

repo_name ="xiaye13579/BBLL"
repo = g.get_repo(repo_name)

issues = repo.get_issues(state='all')

print(issues[0].created_at)