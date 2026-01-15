import Mathlib.Data.ZMod.Basic
import Mathlib.Data.Polynomial.Basic
import Mathlib.RingTheory.Ideal.Quotient

open Polynomial

def Introspective (p r m : ℕ) (f : Polynomial (ZMod p)) : Prop :=
  let I := polyModIdeal p r
  Ideal.Quotient.mk I (f ^ m)
    = Ideal.Quotient.mk I (f.comp ((X : Polynomial (ZMod p)) ^ m))
