import React, { useState } from "react";
import "./InheritanceAnalysis.css";

const diseaseData = {
  Thalassemia: {
    pattern: "Autosomal Recessive",
    locus: "HBB / HBA1 / HBA2 (Chromosomes 11 & 16)",
    genotypeCross: "Carrier Mother (Aa) × Carrier Father (Aa)",
    punnett: [
      { genotype: "AA", type: "unaffected", label: "Unaffected", prob: "25%", desc: "Normal Hb synthesis" },
      { genotype: "Aa", type: "carrier", label: "Carrier Trait", prob: "25%", desc: "Asymptomatic carrier" },
      { genotype: "Aa", type: "carrier", label: "Carrier Trait", prob: "25%", desc: "Asymptomatic carrier" },
      { genotype: "aa", type: "affected", label: "Affected (Major)", prob: "25%", desc: "Requires ongoing care" },
    ],
    biology: "Thalassemia is caused by mutations in globin genes on autosomes. Inheriting one mutant allele results in Thalassemia Trait (carrier), while inheriting two leads to Thalassemia Major.",
    percentages: { unaffected: "25%", carrier: "50%", affected: "25%" },
    carrierRisk: "Carriers are usually asymptomatic but have mild microcytosis. Partner screening before marriage/conception is highly recommended.",
    familyPlanning: "Prenatal diagnosis via Chorionic Villus Sampling (CVS) or Amniocentesis can determine fetal genotype by weeks 10–12 of pregnancy."
  },
  Hemophilia: {
    pattern: "X-Linked Recessive",
    locus: "F8 / F9 Genes (X Chromosome)",
    genotypeCross: "Carrier Mother (XᴴXʰ) × Normal Father (XᴴY)",
    punnett: [
      { genotype: "XᴴXᴴ", type: "unaffected", label: "Unaffected Female", prob: "25%", desc: "Normal clotting" },
      { genotype: "XᴴY", type: "unaffected", label: "Unaffected Male", prob: "25%", desc: "Normal clotting" },
      { genotype: "XᴴXʰ", type: "carrier", label: "Carrier Female", prob: "25%", desc: "Asymptomatic carrier" },
      { genotype: "XʰY", type: "affected", label: "Affected Male", prob: "25%", desc: "Factor VIII/IX deficiency" },
    ],
    biology: "Hemophilia A and B are X-linked recessive bleeding disorders. Males carrying a single mutated X chromosome are affected, whereas females with one mutated X are carriers.",
    percentages: { unaffected: "50%", carrier: "25% (Females)", affected: "25% (Males)" },
    carrierRisk: "Female carriers usually have normal clotting factor levels, but may experience excessive bleeding during surgery or menstruation.",
    familyPlanning: "Pre-implantation Genetic Testing (PGT-M) during IVF allows selection of unaffected embryos prior to implantation."
  },
  "Breast Cancer": {
    pattern: "Autosomal Dominant (BRCA1/2)",
    locus: "BRCA1 (17q21) / BRCA2 (13q13)",
    genotypeCross: "Affected Parent (Bb) × Normal Parent (bb)",
    punnett: [
      { genotype: "Bb", type: "affected", label: "High Risk (Heterozygous)", prob: "25%", desc: "50–85% Lifetime Risk" },
      { genotype: "bb", type: "unaffected", label: "Average Risk", prob: "25%", desc: "Population baseline risk" },
      { genotype: "Bb", type: "affected", label: "High Risk (Heterozygous)", prob: "25%", desc: "50–85% Lifetime Risk" },
      { genotype: "bb", type: "unaffected", label: "Average Risk", prob: "25%", desc: "Population baseline risk" },
    ],
    biology: "Hereditary Breast and Ovarian Cancer (HBOC) syndrome follows an autosomal dominant pattern. A single inherited copy of a mutated BRCA gene significantly elevates risk.",
    percentages: { unaffected: "50%", carrier: "N/A (Dominant)", affected: "50%" },
    carrierRisk: "Individuals inheriting the variant have up to an 80% risk of developing breast cancer and up to 40% risk for ovarian cancer.",
    familyPlanning: "Enhanced screening (annual breast MRI starting at age 25) or risk-reducing interventions are standard preventive options."
  },
  "Sickle Cell Anemia": {
    pattern: "Autosomal Recessive",
    locus: "HBB Gene (Chromosome 11p15.5)",
    genotypeCross: "Sickle Trait (HbAS) × Sickle Trait (HbAS)",
    punnett: [
      { genotype: "AA", type: "unaffected", label: "Normal (HbAA)", prob: "25%", desc: "Normal hemoglobin" },
      { genotype: "AS", type: "carrier", label: "Sickle Trait (HbAS)", prob: "25%", desc: "Carrier state" },
      { genotype: "AS", type: "carrier", label: "Sickle Trait (HbAS)", prob: "25%", desc: "Carrier state" },
      { genotype: "SS", type: "affected", label: "Sickle Cell Disease (HbSS)", prob: "25%", desc: "Vaso-occlusive risk" },
    ],
    biology: "Caused by a single nucleotide substitution in the HBB gene. Individuals with two HbS alleles suffer from sickle cell anemia, causing RBC sickling under low oxygen.",
    percentages: { unaffected: "25%", carrier: "50%", affected: "25%" },
    carrierRisk: "Sickle Cell Trait (HbAS) carriers are generally asymptomatic but may experience sickling under severe hypoxia or dehydration.",
    familyPlanning: "Hemoglobin electrophoresis screening for both partners determines compound risk for offspring."
  },
  "Cystic Fibrosis": {
    pattern: "Autosomal Recessive",
    locus: "CFTR Gene (Chromosome 7q31.2)",
    genotypeCross: "Carrier Mother (Ff) × Carrier Father (Ff)",
    punnett: [
      { genotype: "FF", type: "unaffected", label: "Unaffected", prob: "25%", desc: "Normal CFTR function" },
      { genotype: "Ff", type: "carrier", label: "Carrier", prob: "25%", desc: "Asymptomatic carrier" },
      { genotype: "Ff", type: "carrier", label: "Carrier", prob: "25%", desc: "Asymptomatic carrier" },
      { genotype: "ff", type: "affected", label: "Cystic Fibrosis", prob: "25%", desc: "Multisystem involvement" },
    ],
    biology: "Mutations in CFTR disrupt chloride transport across epithelial cells. Inheriting two mutated alleles leads to thick mucus production in respiratory and GI tracts.",
    percentages: { unaffected: "25%", carrier: "50%", affected: "25%" },
    carrierRisk: "Carriers show no clinical manifestations. Targeted carrier screening panels check for common CFTR mutations like ΔF508.",
    familyPlanning: "Early newborn screening and targeted pre-conception gene sequencing enable proactive clinical mapping."
  }
};

function InheritanceAnalysis() {
  const [selectedDisease, setSelectedDisease] = useState("Thalassemia");
  const data = diseaseData[selectedDisease];

  return (
    <div className="inheritance-page">
      {/* Page Header */}
      <div className="inheritance-header">
        <h1>Inheritance Risk Analysis</h1>
      </div>

      {/* Disease Selection Tabs */}
      <div className="disease-tabs">
        {Object.keys(diseaseData).map((disease) => (
          <button
            key={disease}
            className={`tab-btn ${selectedDisease === disease ? "active" : ""}`}
            onClick={() => setSelectedDisease(disease)}
          >
            {disease}
          </button>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="inheritance-grid">
        {/* Left Column: Interactive Punnett Square Visualizer */}
        <div className="card punnett-card">
          <div className="card-header">
            <div>
              <h3>Interactive Punnett Square</h3>
              <p className="cross-subtitle">{data.genotypeCross}</p>
            </div>
            <span className="pattern-badge">{data.pattern}</span>
          </div>

          <div className="punnett-wrapper">
            <div className="punnett-grid">
              {data.punnett.map((item, idx) => (
                <div key={idx} className={`punnett-cell cell-${item.type}`}>
                  <span className="cell-prob">{item.prob}</span>
                  <span className="cell-genotype">{item.genotype}</span>
                  <span className="cell-label">{item.label}</span>
                  <small className="cell-desc">{item.desc}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Probability Legend */}
          <div className="legend-box">
            <div className="legend-item">
              <span className="dot unaffected"></span>
              <span>Unaffected: <strong>{data.percentages.unaffected}</strong></span>
            </div>
            {data.percentages.carrier !== "N/A (Dominant)" && (
              <div className="legend-item">
                <span className="dot carrier"></span>
                <span>Carrier: <strong>{data.percentages.carrier}</strong></span>
              </div>
            )}
            <div className="legend-item">
              <span className="dot affected"></span>
              <span>Affected: <strong>{data.percentages.affected}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Details & Guidance (Equal Height Cards) */}
        <div className="right-stack">
          {/* Biology Overview */}
          <div className="card detail-card">
            <div className="section-title">
              <h3>Biological Basis & Locus</h3>
            </div>
            <p className="gene-locus-tag"><strong>Gene Locus:</strong> {data.locus}</p>
            <p className="card-text">{data.biology}</p>
          </div>

          {/* Carrier Risk & Counseling */}
          <div className="card detail-card">
            <div className="section-title">
              <h3>Carrier Phenotype & Screening</h3>
            </div>
            <p className="card-text">{data.carrierRisk}</p>
          </div>

          {/* Family Planning */}
          <div className="card detail-card highlight-card">
            <div className="section-title">
              <h3>Reproductive Counseling & Next Steps</h3>
            </div>
            <p className="card-text">{data.familyPlanning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InheritanceAnalysis;