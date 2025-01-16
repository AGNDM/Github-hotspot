#使用pygithub
from github import Github
import os
from github import Auth


# Read the token from the environment variable
token = os.getenv('GITHUB_TOKEN')

auth = Auth.Token(token)

# Create the Github object using the token
g = Github(auth=auth)

# Get the authenticated user
user = g.get_user()


# Search a repository by language 
repos = g.search_repositories(query='language:python', sort='stars', order='desc')

# Get the information of the first 10 repositories
for repo in repos[:10]:
    print(repo.full_name)
    print(repo.stargazers_count)
    print(repo.clone_url)
    print(repo.description)

    # Get the main contributors of the repository and the regions
    contributors = repo.get_contributors()
    for contributor in contributors[:5]:
        print(f"the username is {contributor.login}")
        print(f"the location is {contributor.location}")
    print('---------------------------------')

## Select popular repositories (star>1000)
#for repo in repos:
#    if repo.stargazers_count > 1000:
#        print(repo.full_name)
#        print(repo.stargazers_count)
#        print(repo.clone_url)
#        print(repo.description)
#        print('---------------------------------')