// server/utils/ruleEvaluator.js

const evaluateCondition = (data, condition) => {
  const { field, operator, value } = condition;
  const dataValue = data[field]; // Get the value from the data object

  if (dataValue === undefined || dataValue === null) {
      // For operators like '===' or '!==' this might be valid, but for numerical/string ops, it's false
      if (operator === '===' && value === null) return true;
      if (operator === '!==' && value === null) return false;
      return false; // For any other operator, if dataValue is missing, condition cannot be met
  }

  switch (operator) {
    case '>': return typeof dataValue === 'number' && dataValue > value;
    case '<': return typeof dataValue === 'number' && dataValue < value;
    case '>=': return typeof dataValue === 'number' && dataValue >= value;
    case '<=': return typeof dataValue === 'number' && dataValue <= value;
    case '===': return dataValue === value; // Strict equality
    case '!==': return dataValue !== value; // Strict inequality
    case 'includes': // Checks if dataValue (string/array) includes 'value'
        if (typeof dataValue === 'string') {
            return dataValue.includes(String(value));
        }
        if (Array.isArray(dataValue)) {
            return dataValue.includes(value);
        }
        return false;
    case 'not_includes': // Checks if dataValue (string/array) does NOT include 'value'
        if (typeof dataValue === 'string') {
            return !dataValue.includes(String(value));
        }
        if (Array.isArray(dataValue)) {
            return !dataValue.includes(value);
        }
        return false;
    case 'in': // Checks if dataValue is present in the 'value' array
        return Array.isArray(value) && value.includes(dataValue);
    case 'not_in': // Checks if dataValue is NOT present in the 'value' array
        return Array.isArray(value) && !value.includes(dataValue);
    case 'regex': // Evaluates using a regular expression
        try {
            const regex = new RegExp(value); // 'value' should be the regex pattern string
            return typeof dataValue === 'string' && regex.test(dataValue);
        } catch (e) {
            console.error(`[RuleEvaluator] Invalid regex pattern: ${value}`, e);
            return false;
        }
    // Add more operators as needed based on your rule requirements (e.g., 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty')
    default:
      console.warn(`[RuleEvaluator] Unknown or unsupported operator: ${operator}`);
      return false;
  }
};

const evaluateRule = (data, conditions) => {
  if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
    // console.warn("[RuleEvaluator] Invalid or empty conditions object. Returning false.");
    return false;
  }

  if (conditions.field && conditions.operator && conditions.value !== undefined) {
    return evaluateCondition(data, conditions);
  }

  const logicOperator = conditions.operator ? conditions.operator.toUpperCase() : 'AND'; // Default to AND
  const subRules = conditions.rules;

  if (!Array.isArray(subRules) || subRules.length === 0) {
    // If it's a complex rule structure, but no sub-rules are defined
    console.warn("[RuleEvaluator] Complex conditions structure but 'rules' array is missing or empty. Returning false.");
    return false;
  }

  if (logicOperator === 'AND') {
    // For 'AND' operator, all sub-rules must evaluate to true
    for (const rule of subRules) {
      if (!evaluateRule(data, rule)) { // Recursively evaluate sub-rules
        return false;
      }
    }
    return true; // All sub-rules passed
  } else if (logicOperator === 'OR') {
    // For 'OR' operator, at least one sub-rule must evaluate to true
    for (const rule of subRules) {
      if (evaluateRule(data, rule)) { // Recursively evaluate sub-rules
        return true;
      }
    }
    return false; // No sub-rules passed
  } else {
    console.warn(`[RuleEvaluator] Unsupported logical operator: ${logicOperator}. Defaulting to false.`);
    return false;
  }
};

module.exports = { evaluateRule };
