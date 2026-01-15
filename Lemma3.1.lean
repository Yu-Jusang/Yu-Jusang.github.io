import Mathlib.Data.Nat.Interval
import Mathlib.Algebra.BigOperators.Basic
import Mathlib.Data.Nat.Factorization.Basic
import Mathlib.Data.ZMod.Basic
import Mathlib.GroupTheory.OrderOfElement
import Mathlib.Data.Nat.GCD

open scoped BigOperators

def LCM (m : ℕ) : ℕ :=
  (Finset.Icc 1 m).lcm Nat.lcm

theorem lemma_3_1 (m : ℕ) (hm : 7 ≤ m) : LCM m ≥ 2 ^ m := by
  sorry


def o (r n : ℕ) : ℕ :=
  if h : Nat.Coprime n r then
    orderOf (ZMod.unitOfCoprime n r h)
  else
    0