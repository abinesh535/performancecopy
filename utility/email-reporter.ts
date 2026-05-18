import { FullConfig, FullResult, Reporter } from '@playwright/test/reporter';
import { calculate, getData } from './metrices';
import { sendMail } from './mail';

export default class EmailReporter implements Reporter {
  async onEnd(result: FullResult) {
    console.log('📧 EmailReporter onEnd: preparing to send report email');

    const data = getData();
    const metrics = await calculate(data);

    try {
      await sendMail(metrics);
      console.log('✅ Report email sent from EmailReporter');
    } catch (error) {
      console.error('❌ Failed to send report email from EmailReporter:', error);
    }
  }
}
