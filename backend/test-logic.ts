const model = "google/gemini-2.5-flash";

console.log("Model name:", model);
console.log("includes('mini'):", model.includes("mini"));
console.log("includes('fast'):", model.includes("fast"));
console.log("includes('cheap'):", model.includes("cheap"));

let groqModel = "llama-3.3-70b-versatile";
if (model.includes("mini") || model.includes("fast") || model.includes("cheap")) {
  groqModel = "llama-3.1-8b-instant";
}
console.log("Resulting groqModel:", groqModel);
