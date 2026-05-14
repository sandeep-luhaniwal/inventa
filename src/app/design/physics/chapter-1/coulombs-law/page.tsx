"use client";

import React from "react";
import PhysicsLabShell from "@/physics/components/common/PhysicsLabShell";
import OutputPanel from "@/physics/components/common/OutputPanel";
import CoulombCanvas from "@/physics/components/coulombs-law/CoulombCanvas";
import { useCoulombSimulation } from "@/physics/hooks/useCoulombSimulation";

export default function CoulombsLawPage() {
  const sim = useCoulombSimulation();

  return (
    <PhysicsLabShell
      currentTopicId="coulombs-law"
      sidebar={
        <OutputPanel
          bodyA={{
            charge: sim.bodyA.charge,
            chargeUnit: sim.bodyA.chargeUnit,
            polarity: sim.bodyA.polarity,
          }}
          bodyB={{
            charge: sim.bodyB.charge,
            chargeUnit: sim.bodyB.chargeUnit,
            polarity: sim.bodyB.polarity,
          }}
          distance={sim.distance}
          distanceUnit={sim.distanceUnit}
          force={sim.forceFormatted}
          forceType={sim.forceType}
          onChargeChange={sim.setCharge}
          onChargeUnitChange={sim.setChargeUnit}
          onPolarityChange={sim.setPolarity}
          onDistanceChange={sim.setDistance}
          onDistanceUnitChange={sim.setDistanceUnit}
          onReset={sim.resetSimulation}
        />
      }
    >
      <CoulombCanvas
        bodyA={sim.bodyA}
        bodyB={sim.bodyB}
        distance={sim.distance}
        distanceUnit={sim.distanceUnit}
        force={sim.force}
        forceType={sim.forceType}
        ionCountA={sim.ionCountA}
        ionCountB={sim.ionCountB}
        glowA={sim.glowA}
        glowB={sim.glowB}
        vibrationAmplitude={sim.vibrationAmplitude}
        fieldLineCount={sim.fieldLineCount}
        onBodyDrag={sim.setBodyPosition}
        onDistanceChange={sim.setDistance}
        forceFormatted={sim.forceFormatted}
      />
    </PhysicsLabShell>
  );
}
