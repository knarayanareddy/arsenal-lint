import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { check, digest, extract, Guard, keygen, loadCatalog, parsePolicyYaml, receipt, replay, verifyReceipt } from "../src/arsenallint.ts";

const catalog=loadCatalog("fixtures/catalog");
const policy=(name:string)=>parsePolicyYaml(readFileSync(`fixtures/${name}.yaml`,"utf8"));
test("golden policy verdicts retain contract findings, badges, and deterministic seals",()=>{
  for(const [name,status,rules] of [["fail","FAIL",["R1","R5","R7","R10","R3","R4","R6","R8"]],["pass","PASS",[]],["conflict","FAIL",["R1","R11"]]] as const) { const first=check(policy(name),catalog,name), second=check(policy(name),catalog,name); assert.equal(first.status,status);assert.deepEqual(first.findings.map(x=>x.rule),rules);assert.ok(first.seal);assert.equal(first.seal,second.seal);assert.deepEqual(first.cited_tips,[...first.cited_tips].sort()); }
  assert.deepEqual(check(policy("fail"),catalog,"fail").unsubstantiated_claims,["require-human-approval-for-irreversible-actions"]);
  assert.equal((check(policy("conflict"),catalog,"conflict").remediation_plan as any).ranked[0].rule,"R1");
});
test("contract golden JSON matches except for the separately asserted seal",()=>{
  for (const name of ["fail","pass","conflict"]) { const actual:any=check(policy(name),catalog,name), expected=JSON.parse(readFileSync(`fixtures/expected/${name}.json`,"utf8")); assert.ok(actual.seal); actual.seal=null; assert.deepEqual(actual,expected); }
});
test("R2, R9, WARN, pin mismatch, and unknown claims are deterministic",()=>{
  const p=policy("pass"); p.roles[0].tools=[]; assert.ok(check(p,catalog,"r2").findings.some(x=>x.rule==="R2"));
  const code=policy("pass");code.runtime.code_exec_tools=["shell"];code.guardrails.sandbox_code_exec=false;assert.ok(check(code,catalog,"r9").findings.some(x=>x.rule==="R9"));
  const warn=policy("pass");warn.claims=["budget-context-before-adding-tools"];assert.equal(check(warn,catalog,"warn").status,"WARN");
  const pin=policy("pass");pin.catalog_commit="wrong";assert.throws(()=>check(pin,catalog),/pin mismatch/);
  const fake=policy("pass");fake.claims=["invented-tip"];assert.throws(()=>check(fake,catalog),/unknown\/fabricated/);
});
test("literal manifest extraction, semantic evidence, unsafe replay, guard and receipt tampering",()=>{
  const unsafe=extract("examples/unsafe-agent.ts"), hardened=extract("examples/hardened-agent.ts"); assert.equal(unsafe.roles[0].irreversible_tools[0],"apply_change");assert.ok(unsafe.evidence.some(x=>x.kind==="inferred"));
  const naive=replay(policy("pass"),"fixtures/traces/adversarial.jsonl",false), guarded=replay(policy("pass"),"fixtures/traces/adversarial.jsonl",true);assert.equal(naive[0].result,"executed");assert.equal(guarded[0].result,"blocked");assert.equal(guarded.at(-1)?.result,"blocked");assert.throws(()=>new Guard(policy("pass")).call("executor","inspect"),/fail closed/);
  const v=check(policy("pass"),catalog,"pass"), keys=keygen(), rec=receipt(policy("pass"),hardened,v,"source",guarded,keys.privateKey,catalog.commit);assert.equal(verifyReceipt(rec,keys.publicKey,{policy:policy("pass"),capability:hardened,replay:guarded,catalogCommit:catalog.commit}),true);const changed=policy("pass");changed.version="tampered";assert.equal(verifyReceipt(rec,keys.publicKey,{policy:changed,capability:hardened,replay:guarded,catalogCommit:catalog.commit}),false);assert.equal(verifyReceipt(rec,keys.publicKey,{policy:policy("pass"),capability:hardened,replay:guarded,catalogCommit:"tampered"}),false);assert.notEqual(digest(policy("pass")),digest(changed));
});
