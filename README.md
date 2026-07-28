# Tori Cores Calculator

线上地址：<https://tori.menglayer.cc/>

一个可直接部署到 GitHub Pages 的 Tori Finance Cores 情景计算器。界面参考 Saturn 计算器的多仓位、全网假设、Pendle YT 与结果卡片结构，但公式和数据源按 Tori 当前产品重新核对。

## 已研究并落实的规则

- 普通仓位：`每日 Cores = 美元名义金额 × Tori Opportunities 当前倍率`。
- 推荐奖励：官方规则为被邀请人所获 Cores 的 10%，奖励额外发放，不扣减对方积分。
- Pendle YT：`YT 数量 = 买入金额 ÷ 实时 YT 价格`；`计分名义本金 = YT 数量 × 底层资产价格`。1 YT 获取 1 单位底层资产的收益和积分，计算按 Pendle 文档扣除 3% YT 费。
- YT 计分与底息在模拟结束或 YT 到期的较早日期停止；若模拟结束早于到期，残值以当前 YT 成本按剩余期限线性估算。该残值仅为情景近似。
- 估值：`空投池价值 = FDV × Cores 空投占比`；`个人估值 = 空投池价值 × 个人预测 Cores ÷ 预测全网 Cores`。

默认情景为：空投日期 `2026-11-26`（与当前 YT 到期日一致）、FDV `$200M`、Cores 空投占比 `5%`、全网 Cores 日增长 `2%`。这些值均可在页面修改，属于情景假设，并非 Tori 官方参数。

## 数据源与 GitHub Pages 约束

- 倍率：人工核对 [Tori Opportunities](https://app.tori.finance/opportunities)，最后核对日期为 2026-07-28。
- 排行榜：[Tori leaderboard API](https://app.tori.finance/api/leaderboard)。接口没有 `Access-Control-Allow-Origin`，GitHub Pages 无法在访问时直接跨域读取。部署工作流每 30 分钟抓取一次并写入同源 `data/leaderboard.json`。
- YT 价格、底层价格、APY 与到期日：浏览器直接读取 Pendle 官方市场 API；该接口允许跨域。读取失败时使用页面内明确标记的 2026-07-28 快照。
- 官方规则：[Tori Cores](https://docs.tori.finance/resources/cores)、[Referral Program](https://docs.tori.finance/resources/referral)、[Pendle Points Trading](https://docs.pendle.finance/pendle-academy/ecosystem-and-resources/points-trading)。

## 本地运行与验证

```powershell
npm run check
npm test
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。直接双击 HTML 不适用于 ES modules，请使用任意静态 HTTP server。

如需手动刷新仓库内的排行榜快照：

```powershell
npm run sync-data
```

## 部署到 GitHub Pages

1. 将仓库推送到 GitHub 的 `main` 或 `master` 分支。
2. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
3. 推送后 `.github/workflows/deploy-pages.yml` 会测试、抓取排行榜并发布站点。
4. 定时任务每小时的第 17、47 分钟重新部署排行榜数据；GitHub 的计划任务可能有少量延迟。

仓库根目录的 `CNAME` 固定为 `tori.menglayer.cc`。DNS 应将 `tori` 配置为指向 `menglayer.github.io` 的 CNAME。

工作流使用 GitHub 当前文档示例对应的 `checkout@v6`、`configure-pages@v5`、`upload-pages-artifact@v4` 和 `deploy-pages@v4`。

## 风险边界

这是非官方社区工具，仅用于情景研究。倍率、积分规则、实时价格、TGE、空投比例和分配方法都可能变化；最终结果以 Tori、Pendle 和相关协议实际记账及公告为准。
