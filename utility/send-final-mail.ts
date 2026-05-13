import { sendMail } from './mail';
import { calculate, getData } from './metrices';

async function main() {

  const data = getData();
  const result = await calculate(data);

  await sendMail(result);
}

main();