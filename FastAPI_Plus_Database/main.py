from random import randrange
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Post(BaseModel):
    title: str
    content: str
    publish: bool = True
    rating: Optional[int] = None

my_posts = [
    {"title": "Favorite Cities", "content": "I Love Paris", "id": 1},
    {"title": "Favorite Food",   "content": "I like Indian Food", "id": 2},
]

def getPostByID(postId):
    for p in my_posts:
        if p['id']==postId:
            return p
      


@app.get("/")
def root():
    return {"data": "Hello World"}

@app.get("/posts")
def get_posts():
    return {"data": my_posts}

# @app.post("/createPosts")
# def create_posts(new_Posts: Post):
#     print(new_Posts.dict())
#     return {"data": "Received Successfully"}
@app.post("/posts")
def create_posts(new_Posts: Post):
    myPosts=new_Posts.dict()
    myPosts['id']=randrange(0,10000)
    my_posts.append(myPosts)
    return {"data":myPosts}

@app.get("/post/{id}")
def get_Post_By_Id(id:int):
    myPost=getPostByID(id)
    return {"data":myPost}