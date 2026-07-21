defineAgent({ roles: [{ id: "executor", tools: ["inspect"] }], runtime: { max_steps: 50, retry_cap: 3 }, guardrails: { human_approval_for: ["apply_change"], kill_switch: true } });
