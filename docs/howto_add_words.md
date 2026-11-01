然后在 iPhone 上安装
1. 用 Safari 打开 https://piupiuisland.github.io/ronnie_woorden/
2. 点 分享 → 添加到主屏幕 → 添加

以后加词
cd mijn-woordenboek
npm run new-day                     # 填好今天的词
git add . && git commit -m "words" && git push
每次 push 后,GitHub 会先检查词库并跑测试,通过了才部署。哪个词写错了,部署会失败,不会把坏数据发到手机上。部署完之后,在 iPhone 上关掉 app 再打开,就能看到新词。

几点说明
- 提交身份: 这个仓库的提交用户是 piupiuisland,邮箱是 piupiuisland@users.noreply.github.com。这个设置只对这个仓库有效,你的公司邮箱不会出现在个人仓库里,其他仓库也不受影响。
- 仓库是公开的: 别人能看到代码和词库。
- 新增文件: 我加了自动部署配置 .github/workflows/deploy.yml,README 里也补了部署说明。