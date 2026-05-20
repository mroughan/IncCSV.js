export const examples = {
  basic: `---
title = Sensor readings
version = 1
[columns]
time = seconds
temperature = Celsius
---
time,temperature
0,21.4
1,21.8
2,22.1
`,
  semicolon: `---
title = Semicolon data
[structure]
delimiter = ;
---
name;score
Ada;21
Babbage;12
`,
  metadata: `---
title = Metadata edge cases
empty =
hash = #
semicolon = ;
path = C:\\tmp\\data
quoted = "say \\"hi\\" with \\\\"
id = "007"
offset = -3
---
name,value
Ada,1
`,
  plainCsv: `name,score
Ada,21
Babbage,12
`,
};

export const schemaText = `---
[schema]
allow_extra = false
[MUST]
title = String
columns.temperature = String
[OPTIONAL]
version = Int
columns.time = String
---
`;
