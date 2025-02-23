#通过pygithub获取某个项目的star，issue，fork数量的历史记录变化
import pandas as pd
from github import Github
import os
from datetime import datetime
from collections import defaultdict

def get_monthly_counts(data):
    monthly_counts = defaultdict(int)
    for date, _ in data:
        key = f"{date.year}.{date.month}"
        monthly_counts[key] += 1
    return sorted([(float(k), v) for k, v in monthly_counts.items()])

def get_repo_info(repo_name):
    token = os.getenv('GITHUB_TOKEN')
    g = Github(token)
    repo = g.get_repo(repo_name)
    
    # Get creation date of repo
    created_at = repo.created_at
    
    # Collect raw data
    stars = []
    issues = []
    forks = []
    
    for i in repo.get_stargazers_with_dates():
        stars.append((i.starred_at, i.user.login))
    for i in repo.get_issue():
        issues.append((i.created_at, i.user.login))
    for i in repo.get_forks_with_dates():
        forks.append((i.created_at, i.user.login))
    
    # Convert to monthly statistics
    monthly_stars = get_monthly_counts(stars)
    monthly_issues = get_monthly_counts(issues)
    monthly_forks = get_monthly_counts(forks)
    
    return monthly_stars, monthly_issues, monthly_forks
