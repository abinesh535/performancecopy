"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChart = generateChart;
const chartjs_node_canvas_1 = require("chartjs-node-canvas");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function generateChart(metrics) {
    const width = 600;
    const height = 300;
    const canvas = new chartjs_node_canvas_1.ChartJSNodeCanvas({ width, height });
    // ✅ BAR CHART (Latency)
    const barConfig = {
        type: 'bar',
        data: {
            labels: ['Median', 'P90', 'P95', 'P99'],
            datasets: [
                {
                    label: 'Latency (ms)',
                    data: [
                        metrics.median ?? 0,
                        metrics.p90 ?? 0,
                        metrics.p95 ?? 0,
                        metrics.p99 ?? 0,
                    ],
                },
            ],
        },
    };
    const barBuffer = await canvas.renderToBuffer(barConfig);
    // ✅ PIE CHART (Pass/Fail)
    const pass = metrics.totalRequests
        ? (metrics.successRate / 100) * metrics.totalRequests
        : 0;
    const fail = metrics.totalRequests
        ? (metrics.errorRate / 100) * metrics.totalRequests
        : 0;
    console.log(metrics.successRate, metrics.errorRate);
    const total = pass + fail;
    const chartData = total === 0 ? [1, 1] : [pass, fail];
    const pieConfig = {
        type: 'pie',
        data: {
            labels: [
                `Passed (${total ? ((pass / total) * 100).toFixed(1) : 0}%)`,
                `Failed (${total ? ((fail / total) * 100).toFixed(1) : 0}%)`
            ],
            datasets: [
                {
                    data: chartData,
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: { position: 'bottom' },
            },
        },
    };
    const pieBuffer = await canvas.renderToBuffer(pieConfig);
    // ✅ Save files
    const reportDir = path_1.default.resolve('playwright-report');
    fs_1.default.mkdirSync(reportDir, { recursive: true });
    const barPath = path_1.default.join(reportDir, 'latency-chart.png');
    const piePath = path_1.default.join(reportDir, 'pass-fail-chart.png');
    fs_1.default.writeFileSync(barPath, barBuffer);
    fs_1.default.writeFileSync(piePath, pieBuffer);
    return { barPath, piePath };
}
