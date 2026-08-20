import fs from "fs";
import path from "path";

const problemsDir = "./tmp_leetcode/problems";
const files = fs.readdirSync(problemsDir).slice(0, 15); // test on first 15

let outputText = "Analyzing first 15 files:\n";
for (const file of files) {
  const filePath = path.join(problemsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  const jsSnippet = data.code_snippets?.javascript || "";
  
  let functionName = "";
  let params = "";
  
  let match = jsSnippet.match(/var\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
  if (match) {
    functionName = match[1];
    params = match[2].trim();
  } else {
    match = jsSnippet.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (match) {
      functionName = match[1];
      params = match[2].trim();
    }
  }

  const testCases = [];
  if (data.examples) {
    for (const ex of data.examples) {
      const matchInput = ex.example_text.match(/Input:\s*(.*)/i);
      const matchOutput = ex.example_text.match(/Output:\s*(.*)/i);
      if (matchInput && matchOutput) {
        testCases.push({
          rawInput: matchInput[1].trim(),
          rawOutput: matchOutput[1].trim()
        });
      }
    }
  }

  outputText += `- File: ${file}\n`;
  outputText += `  Title: ${data.title}\n`;
  outputText += `  Difficulty: ${data.difficulty}\n`;
  outputText += `  FunctionName: ${functionName}\n`;
  outputText += `  Params: ${params}\n`;
  outputText += `  JS Boilerplate: ${jsSnippet.slice(0, 60).replace(/\n/g, "\\n")}...\n`;
  outputText += `  Test Cases: ${JSON.stringify(testCases)}\n\n`;
}

fs.writeFileSync("test_parse_output.txt", outputText, "utf-8");
console.log("Written test_parse_output.txt");

