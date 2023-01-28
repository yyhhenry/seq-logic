# Electron Builder Pnpm Template

#### 介绍
Electron Builder Pnpm Template

#### 说明
如果使用forge或者在builder中使用第三方nodejs库
请修改pnpm设置为
```
node-linker=hoisted
shamefully-hoist=true
```