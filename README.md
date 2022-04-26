# 仿照 [Build your own React](https://pomb.us/build-your-own-react/) 写的demo

尽量在此基础上进行迭代，学习一些功能的源码

#### 根据 `feature` 下的分支序号进行编写即可

例如：`feature/v0.0.0`是最初的版本，`feature/v0.0.6`是已经写好的版本

#### 开发注意

  1. 需要在最新版本切出去开发迭代，保留每次迭代前的snapshot
  2. 切分支命令：`git checkout -b [name]`
  3. 再未推送过的分支第一次推送使用命令：`git push --set-upstream origin [name]`（这里的最后代表分支名称）
  4. 删除本地分支，需要先切到别的分支：先`git checkout [name]`再`git branch -d [name]`（-D：强制删除），`git push origin --delete`删除远程仓库
  5. 合并分支：`git merge [name]`，将`[name]`分支合并到当前分支
  6. 遴选操作：`git cherry-pick [hash value]`，使用某次提交的hash值

#### React版本问题

使用的是 v18 之前的版本