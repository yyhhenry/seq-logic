# Electron Builder Pnpm Template

## 介绍
Electron Builder Pnpm Template

## 说明
如果使用forge或者在builder中使用第三方nodejs库
请修改pnpm设置为
```
node-linker=hoisted
shamefully-hoist=true
```

## 关于硬件加速
不禁用硬件加速会导致如下问题产生，但是禁用硬件加速会导致页面渲染受到较大的影响
```
[27052:0129/201006.659:ERROR:gpu_init.cc(523)] Passthrough is not supported, GL is disabled, ANGLE is
```
