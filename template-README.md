# Electron Builder Pnpm Template

## 介绍

Electron Builder Pnpm Template

## 说明

如果使用forge或者在builder中使用第三方nodejs库
请修改pnpm设置为

```txt
node-linker=hoisted
shamefully-hoist=true
```

## 关于硬件加速

不禁用硬件加速会导致如下问题产生，但是禁用硬件加速会导致页面渲染受到较大的影响

```txt
[27052:0129/201006.659:ERROR:gpu_init.cc(523)] Passthrough is not supported, GL is disabled, ANGLE is
```

## 关于Linux

snap安装方式

```sh
snap install --dangerous electron-builder-pnpm-template_1.0.0_amd64.snap

```

直接执行unpack文件夹下的可执行文件可能遇到有关硬件加速的问题，使用snap安装后解决
