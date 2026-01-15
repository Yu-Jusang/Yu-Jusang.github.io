import Mathlib.Data.ZMod.Basic
import Mathlib.Data.Polynomial
import Mathlib.Data.Nat.Prime

open Polynomial

variable {n : ℕ} (hp : n.Prime)
variable (a : ZMod n)

theorem Lemma2.1 (a : ℤ) (n : ℕ) (hn : 2 ≤ n) (hcop : IsCoprime a (n : ℤ)) :
    Nat.Prime n ↔
      ((X + C (a : ZMod n) : Polynomial (ZMod n)) ^ n
        = X ^ n + C (a : ZMod n)) := by
  sorry

df
