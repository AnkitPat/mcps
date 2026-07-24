import { countPodsTool, getPodsHealthTool, getPodLogsTool } from "../kubernates-mcp/src/tools/kubernetesTools.js";

async function runDebug() {
  console.log("--- Debugging Kubernetes Tools ---");

  // Example 1: Count Pods
/*   console.log("\n1. Testing countPodsTool:");
  try {
    const result = await countPodsTool.execute({});
    console.log(result);
  } catch (err) {
    console.error("Error in countPodsTool:", err);
  }
 */
  // Example 2: Get Pods Health (requires namespace)
 /*  console.log("\n2. Testing getPodsHealthTool (namespace: 'default'):");
  try {
    const result = await getPodsHealthTool.execute({ namespace: "default" });
    console.log(result);
  } catch (err) {
    console.error("Error in getPodsHealthTool:", err);
  } */

  // Example 3: Get Pod Logs (requires namespace OR podSearch)
  console.log("\n3. Testing getPodLogsTool (namespace: 'default'):");
  try {
    const result = await getPodLogsTool.execute({ namespace: "default" });
    console.log(result);
  } catch (err) {
    console.error("Error in getPodLogsTool:", err);
  }
}

runDebug().catch(console.error);
