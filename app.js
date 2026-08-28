function updateAddress(method, url) {
  try { history[method](null, "", url); }
  catch { /* Some browsers restrict address changes for local files. */ }
}

class ProcessView {
  constructor() {
    this.grid = document.querySelector("#process-grid");
    this.items = [...this.grid.querySelectorAll(".process-item")];
    this.stations = this.items.map(item => item.querySelector(".process-station"));
    this.detail = document.querySelector("#stage-detail");
    this.detailIndex = document.querySelector("#detail-index");
    this.detailTitle = document.querySelector("#detail-title");
    this.detailDescription = document.querySelector("#detail-description");
    this.detailSteps = document.querySelector("#detail-steps");
    this.detailInput = document.querySelector("#detail-input");
    this.detailOutput = document.querySelector("#detail-output");
    this.detailLink = document.querySelector("#detail-link");
    this.detailClose = document.querySelector("#detail-close");
    this.detailScrim = document.querySelector("#detail-scrim");
    this.status = document.querySelector("#status");
    this.events = new AbortController();
    this.activeIndex = 0;
  }

  mount() {
    this.grid.addEventListener("click", event => this.onClick(event), { signal: this.events.signal });
    this.grid.addEventListener("keydown", event => this.onKeydown(event), { signal: this.events.signal });
    this.detailClose.addEventListener("click", () => this.closeDetail(), { signal: this.events.signal });
    this.detailScrim.addEventListener("click", () => this.closeDetail(), { signal: this.events.signal });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") this.closeDetail();
    }, { signal: this.events.signal });
    const activeHash = LEGACY_HASHES[location.hash] || location.hash;
    const hashIndex = this.items.findIndex(item => `#${item.id}` === activeHash);
    if (hashIndex >= 0) this.activeIndex = hashIndex;
    else updateAddress("replaceState", `#${this.items[0].id}`);
    this.openDetail();
    this.render(false);
  }

  onClick(event) {
    const station = event.target.closest(".process-station");
    if (station) this.select(Number(station.closest(".process-item").dataset.step));
  }

  onKeydown(event) {
    const station = event.target.closest(".process-station");
    if (!station) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;

    const current = Number(station.closest(".process-item").dataset.step);
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = this.items.length - 1;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = Math.max(0, current - 1);
    else next = Math.min(this.items.length - 1, current + 1);

    event.preventDefault();
    this.select(next);
    this.stations[next].focus();
  }

  select(index) {
    this.activeIndex = Math.max(0, Math.min(this.items.length - 1, index));
    updateAddress("replaceState", `#${this.items[this.activeIndex].id}`);
    this.openDetail();
    this.render();
  }

  render(announce = true) {
    const index = this.activeIndex;
    const detailVisible = !matchMedia("(max-width: 760px)").matches || this.detail.dataset.open === "true";
    this.items.forEach((item, itemIndex) => {
      item.dataset.state = itemIndex === index ? "active" : "pending";
      this.stations[itemIndex].setAttribute("aria-expanded", String(itemIndex === index && detailVisible));
      if (itemIndex === index) this.stations[itemIndex].setAttribute("aria-current", "step");
      else this.stations[itemIndex].removeAttribute("aria-current");
    });

    const stage = STAGES[index];
    this.detailIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(this.items.length).padStart(2, "0")}`;
    this.detailTitle.textContent = stage.title;
    this.detailDescription.textContent = stage.description;
    this.detailInput.textContent = stage.input;
    this.detailOutput.textContent = stage.output;
    this.detailLink.href = `./research.html?stage=${stage.slug}&subprocess=${stage.steps[0].slug}`;
    this.detailSteps.replaceChildren(...stage.steps.map((step, stepIndex) => {
      const item = document.createElement("li");
      const number = document.createElement("b");
      number.textContent = String(stepIndex + 1).padStart(2, "0");
      const text = document.createElement("span");
      const action = document.createElement("strong");
      const purpose = document.createElement("small");
      action.textContent = step.action;
      purpose.textContent = step.purpose;
      text.append(action, purpose);
      item.append(number, text);
      return item;
    }));

    if (!announce) return;
    this.status.textContent = `Selected step ${index + 1} of ${this.items.length}: ${stage.title}.`;
  }

  openDetail() {
    this.detail.dataset.open = "true";
    document.body.classList.add("detail-open");
  }

  closeDetail() {
    if (!matchMedia("(max-width: 760px)").matches || this.detail.dataset.open !== "true") return;
    this.detail.dataset.open = "false";
    document.body.classList.remove("detail-open");
    this.stations[this.activeIndex].setAttribute("aria-expanded", "false");
    this.stations[this.activeIndex].focus();
  }

  destroy() { this.events.abort(); }
}

const STAGES = [
  {
    slug: "prepare", domain: "Write", title: "Prepare the digital object",
    description: "Validate the source and turn it into bounded blocks with metadata for recovery and integrity checks.",
    input: "Source file",
    output: "Codec-ready blocks and integrity metadata",
    steps: [
      { action: "Validate input", purpose: "Confirm the file can be read and record its type and size." },
      { action: "Compress / encrypt*", purpose: "Reduce the payload and optionally protect its contents." },
      { action: "Create manifest + hash", purpose: "Record block order and define the final integrity check." },
      { action: "Chunk the file", purpose: "Create bounded blocks the codec can protect and recover." }
    ],
    subject: "digital-object preparation",
    scope: "Recent work on compression, encryption, metadata, integrity, and packetization before DNA encoding.",
    terms: 'preprocessing OR compression OR encryption OR packetization OR segmentation OR chunking OR metadata OR manifest OR checksum',
    signals: ["compression", "encryption", "metadata", "packetization", "manifest", "checksum"]
  },
  {
    slug: "encode", domain: "Write", title: "Protect & encode",
    description: "Add recovery redundancy and translate protected source symbols into candidate DNA bases.",
    input: "Codec-ready source blocks",
    output: "Redundant, base-mapped codewords",
    steps: [
      { action: "Frame source blocks", purpose: "Attach block identities and the metadata needed for reassembly." },
      { action: "Add outer redundancy", purpose: "Create parity across blocks so missing oligos can be recovered." },
      { action: "Add inner error correction", purpose: "Protect each codeword against base-level reading errors." },
      { action: "Map symbols to bases", purpose: "Convert protected digital symbols into candidate A/C/G/T strings." }
    ],
    subject: "protection and encoding",
    scope: "Recent work on codecs, redundancy, error correction, constrained coding, and dropout recovery.",
    terms: 'encoding OR codec OR "error correction" OR redundancy OR "fountain code" OR "constrained coding" OR dropout',
    signals: ["error correction", "fountain", "redundancy", "constrained coding", "dropout", "codec"]
  },
  {
    slug: "design", domain: "Write", title: "Design the oligo library",
    description: "Give oligos identities and access regions, then remove sequences that violate biochemical constraints.",
    input: "Base-mapped codewords",
    output: "Synthesis-ready oligo sequences",
    steps: [
      { action: "Assign addresses", purpose: "Give each oligo an identity so blocks can be reordered later." },
      { action: "Add primers / barcodes*", purpose: "Provide optional handles for selective access and sample identity." },
      { action: "Screen biochemical constraints", purpose: "Reject GC extremes, long homopolymers, and unwanted motifs." },
      { action: "Select robust sequences", purpose: "Keep candidates likely to survive synthesis and sequencing." },
      { action: "Finalize oligos", purpose: "Produce the exact ordered sequence library sent for synthesis." }
    ],
    subject: "oligo-library design",
    scope: "Recent work on sequence constraints, addressing, barcodes, primers, and storage-oligo architecture.",
    terms: '"oligonucleotide design" OR "sequence design" OR addressing OR indexing OR barcode OR primer OR "GC content" OR homopolymer',
    signals: ["oligonucleotide design", "addressing", "barcode", "primer", "GC content", "homopolymer"]
  },
  {
    slug: "synthesize", domain: "Write", title: "Synthesize & prepare the pool",
    description: "Manufacture the designed oligos, clean and measure them as needed, then combine the library.",
    input: "Synthesis-ready oligo sequences",
    output: "Physical pooled DNA library",
    steps: [
      { action: "Synthesize oligos", purpose: "Create physical DNA molecules matching the digital designs." },
      { action: "Release / purify", purpose: "Remove synthesis supports, reagents, and failed products as needed." },
      { action: "Quantify / quality-check", purpose: "Measure DNA amount and check whether the pool is usable." },
      { action: "Normalize / pool", purpose: "Combine oligos at controlled proportions for storage." }
    ],
    subject: "DNA synthesis and pool preparation",
    scope: "Recent work on chemical and enzymatic synthesis, purification, quantification, and pooled libraries.",
    terms: '"DNA synthesis" OR "oligonucleotide synthesis" OR "enzymatic synthesis" OR phosphoramidite OR "array synthesis" OR purification OR quantification OR pooling',
    signals: ["enzymatic synthesis", "phosphoramidite", "array synthesis", "purification", "quantification", "pooling"]
  },
  {
    slug: "preserve", domain: "Store", title: "Package & preserve",
    description: "Choose a physical format, identify the container, and maintain defined archive conditions.",
    input: "Physical pooled DNA library",
    output: "Catalogued DNA archive",
    steps: [
      { action: "Choose a storage format", purpose: "Match drying, solution, or encapsulation to the archive goal." },
      { action: "Seal + label", purpose: "Protect the sample and attach an unambiguous physical identity." },
      { action: "Catalog the sample", purpose: "Link its container and location to the digital manifest." },
      { action: "Store under defined conditions", purpose: "Control heat, moisture, light, and contamination exposure." },
      { action: "Monitor / refresh*", purpose: "Optionally check degradation and copy material before it is lost." }
    ],
    subject: "DNA archive preservation",
    scope: "Recent work on stability, degradation, encapsulation, drying, and storage conditions.",
    terms: 'preservation OR stability OR encapsulation OR silica OR drying OR "dry storage" OR archive OR degradation OR aging',
    signals: ["encapsulation", "silica", "dry storage", "stability", "aging", "degradation"]
  },
  {
    slug: "retrieve", domain: "Read", title: "Retrieve & select",
    description: "Locate and release the stored material, then isolate or amplify the molecules needed for reading.",
    input: "Catalogued DNA archive",
    output: "Accessible target molecules",
    steps: [
      { action: "Locate the container", purpose: "Use the archive catalog to find the correct physical sample." },
      { action: "Release / resuspend DNA", purpose: "Make preserved molecules accessible to laboratory handling." },
      { action: "Select / enrich targets*", purpose: "Isolate the requested file or subset from a larger pool." },
      { action: "Amplify / prepare*", purpose: "Create enough target material for the sequencing workflow." }
    ],
    subject: "retrieval and molecular selection",
    scope: "Recent work on random access, selective retrieval, enrichment, amplification, and extraction.",
    terms: 'retrieval OR "random access" OR "selective access" OR enrichment OR PCR OR amplification OR resuspension OR extraction',
    signals: ["random access", "PCR", "enrichment", "amplification", "resuspension", "extraction"]
  },
  {
    slug: "sequence", domain: "Read", title: "Sequence & basecall",
    description: "Prepare molecules for an instrument, measure them, and convert raw signals into reads with quality data.",
    input: "Accessible target molecules",
    output: "Noisy sequence reads and quality values",
    steps: [
      { action: "Prepare a sequencing library", purpose: "Attach the adapters and structures required by the instrument." },
      { action: "Sequence molecules", purpose: "Measure optical or electrical signals from individual DNA fragments." },
      { action: "Basecall", purpose: "Infer A/C/G/T letters and confidence values from raw signals." },
      { action: "Demultiplex + quality-check", purpose: "Assign reads to samples and discard unusable observations." }
    ],
    subject: "sequencing and basecalling",
    scope: "Recent work on sequencing platforms, library preparation, basecalling, demultiplexing, and read quality.",
    terms: 'sequencing OR nanopore OR Illumina OR basecalling OR demultiplexing OR "read quality" OR "library preparation"',
    signals: ["nanopore", "Illumina", "basecalling", "demultiplexing", "read quality", "library preparation"]
  },
  {
    slug: "reconstruct", domain: "Read", title: "Reconstruct, decode & verify",
    description: "Infer the written oligos, repair losses and errors, reverse the codec, and test file integrity.",
    input: "Noisy sequence reads and quality values",
    output: "Verified source file or explicit integrity failure",
    steps: [
      { action: "Filter reads", purpose: "Keep observations relevant and reliable enough for reconstruction." },
      { action: "Cluster + build consensus", purpose: "Group copies of each oligo and infer the written sequence." },
      { action: "Correct errors + recover losses", purpose: "Repair substitutions or indels and reconstruct missing oligos." },
      { action: "Inverse-map + reorder", purpose: "Convert DNA back to digital symbols and restore block order." },
      { action: "Reverse preprocessing*", purpose: "Decrypt or decompress the reconstructed payload when required." },
      { action: "Verify the hash", purpose: "Prove the recovered file matches the original integrity target." }
    ],
    subject: "reconstruction, decoding, and verification",
    scope: "Recent work on clustering, consensus, error recovery, decoding, reassembly, and integrity verification.",
    terms: 'reconstruction OR clustering OR consensus OR decoding OR "error correction" OR "dropout recovery" OR reassembly OR verification',
    signals: ["clustering", "consensus", "reconstruction", "decoding", "error correction", "verification"]
  }
];

const SUBPROCESS_KEYWORDS = {
  prepare: [
    ["file validation", "input validation", "file format", "data integrity"],
    ["compression", "encryption", "source coding", "data security"],
    ["manifest", "metadata", "checksum", "cryptographic hash", "data integrity"],
    ["chunking", "segmentation", "packetization", "data blocks"]
  ],
  encode: [
    ["indexing", "packetization", "addressing", "metadata", "fragmentation"],
    ["outer code", "erasure code", "Reed-Solomon", "fountain code", "dropout recovery"],
    ["inner code", "error-correcting code", "LDPC", "BCH code", "edit errors"],
    ["base mapping", "constrained coding", "DNA encoding", "codeword mapping"]
  ],
  design: [
    ["oligo address", "sequence indexing", "index design", "addressing"],
    ["primer design", "barcode design", "random access", "multiplexing"],
    ["GC content", "homopolymer", "sequence constraint", "forbidden motif", "secondary structure"],
    ["sequence design", "oligo design", "sequence optimization", "constraint coding"],
    ["oligo library", "oligonucleotide design", "sequence library", "oligo architecture"]
  ],
  synthesize: [
    ["DNA synthesis", "oligonucleotide synthesis", "enzymatic synthesis", "phosphoramidite"],
    ["oligo purification", "DNA purification", "deprotection", "cleavage"],
    ["DNA quantification", "quality control", "mass spectrometry", "capillary electrophoresis"],
    ["pool normalization", "oligo pooling", "library pooling", "abundance normalization"]
  ],
  preserve: [
    ["DNA preservation", "dry storage", "encapsulation", "silica", "solution storage"],
    ["DNA encapsulation", "packaging", "container", "sample identification"],
    ["metadata", "database", "sample tracking", "archive indexing"],
    ["storage temperature", "humidity", "DNA stability", "accelerated aging", "degradation"],
    ["degradation", "aging", "stability monitoring", "refresh"]
  ],
  retrieve: [
    ["retrieval", "sample tracking", "archive indexing", "catalog"],
    ["DNA extraction", "resuspension", "decapsulation", "sample recovery"],
    ["random access", "target enrichment", "hybridization capture", "selective access", "CRISPR"],
    ["PCR amplification", "library preparation", "target amplification", "whole-pool amplification"]
  ],
  sequence: [
    ["sequencing library preparation", "adapter ligation", "library construction"],
    ["DNA sequencing", "nanopore sequencing", "Illumina sequencing", "sequencing platform"],
    ["basecalling", "neural basecaller", "signal decoding", "nanopore basecalling"],
    ["demultiplexing", "read filtering", "read quality", "quality control"]
  ],
  reconstruct: [
    ["read quality", "quality filtering", "preprocessing", "read trimming"],
    ["sequence clustering", "consensus sequence", "oligo clustering", "multiple sequence alignment"],
    ["error correction", "indel correction", "dropout recovery", "sequence reconstruction"],
    ["decoding", "inverse mapping", "block reordering", "data reassembly"],
    ["decompression", "decryption", "reverse preprocessing", "payload recovery"],
    ["integrity verification", "checksum", "cryptographic hash", "file verification"]
  ]
};

STAGES.forEach(stage => {
  const definitions = SUBPROCESS_KEYWORDS[stage.slug];
  if (definitions.length !== stage.steps.length) throw new Error(`Missing subprocess query for ${stage.slug}`);
  stage.steps.forEach((step, index) => {
    step.slug = step.action.toLowerCase().replaceAll("*", "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    step.signals = definitions[index];
    step.terms = step.signals.map(term => `"${term}"[Title/Abstract]`).join(" OR ");
  });
});

const SOURCES = {
  snia: {
    label: "SNIA Technology Review (2025)",
    url: "https://www.snia.org/sites/default/files/DNA/SNIA-DNA-Data-Storage-Technology-Review-v1.0.pdf"
  },
  fountain: {
    label: "DNA Fountain — Erlich & Zielinski (2017)",
    url: "https://doi.org/10.1126/science.aaj2038"
  },
  organick: {
    label: "Random access in large-scale DNA storage — Organick et al. (2018)",
    url: "https://doi.org/10.1038/nbt.4079"
  },
  synthesis: {
    label: "High-throughput DNA synthesis review — Yu et al. (2024)",
    url: "https://doi.org/10.1039/D3CS00469D"
  },
  grass: {
    label: "Silica preservation study — Grass et al. (2015)",
    url: "https://doi.org/10.1002/anie.201411378"
  },
  lin: {
    label: "Dynamic DNA information storage — Lin et al. (2020)",
    url: "https://doi.org/10.1038/s41467-020-16797-2"
  },
  lopez: {
    label: "Nanopore data-storage readout — Lopez et al. (2019)",
    url: "https://doi.org/10.1038/s41467-019-10978-4"
  },
  hedges: {
    label: "HEDGES error-correction study — Press et al. (2020)",
    url: "https://doi.org/10.1073/pnas.2004821117"
  },
  selfContained: {
    label: "Self-contained DNA storage system — Li et al. (2021)",
    url: "https://doi.org/10.1038/s41598-021-97570-3"
  },
  sectorOne: {
    label: "SNIA Sector One v1.0 (2023)",
    url: "https://www.snia.org/standards/technology-standards-software/standards-portfolio/dna-data-storage-sector-one"
  },
  jpegDna: {
    label: "JPEG-based image coding for DNA — Dimopoulou et al. (2021)",
    url: "https://doi.org/10.23919/EUSIPCO54536.2021.9616020"
  },
  encryption: {
    label: "Multi-layer encryption of medical data in DNA (2024)",
    url: "https://doi.org/10.1016/j.mtbio.2024.101221"
  },
  church: {
    label: "Next-generation digital information storage in DNA — Church et al. (2012)",
    url: "https://doi.org/10.1126/science.1226355"
  },
  goldman: {
    label: "Information storage in synthesized DNA — Goldman et al. (2013)",
    url: "https://doi.org/10.1038/nature11875"
  },
  yinYang: {
    label: "Yin–Yang codec — Ping et al. (2022)",
    url: "https://doi.org/10.1038/s43588-022-00231-2"
  },
  phosphoramidite: {
    label: "Column/plate phosphoramidite synthesis — Pon & Yu (2004)",
    url: "https://doi.org/10.1093/nar/gkh222"
  },
  arraySynthesis: {
    label: "Nanoscale electrode-well DNA writer — Nguyen et al. (2021)",
    url: "https://doi.org/10.1126/sciadv.abi6714"
  },
  tdt: {
    label: "Terminator-free TdT synthesis — Lee et al. (2019)",
    url: "https://doi.org/10.1038/s41467-019-10258-1"
  },
  motif: {
    label: "Composite-motif ligation — Yan et al. (2023)",
    url: "https://doi.org/10.1038/s41598-023-43172-0"
  },
  dryState: {
    label: "Dehydrated DNA storage spots — Newman et al. (2019)",
    url: "https://doi.org/10.1038/s41467-019-09517-y"
  },
  cellulose: {
    label: "DNA adsorption on cellulose paper — Liu et al. (2023)",
    url: "https://doi.org/10.1002/smtd.202201610"
  },
  microcapsules: {
    label: "Thermoresponsive DNA microcapsules — Bögels et al. (2023)",
    url: "https://doi.org/10.1038/s41565-023-01377-4"
  },
  biological: {
    label: "Digital data in living-cell genomes — Yim et al. (2021)",
    url: "https://doi.org/10.1038/s41589-020-00711-4"
  },
  hybridSearch: {
    label: "Molecular-level similarity search — Bee et al. (2021)",
    url: "https://doi.org/10.1038/s41467-021-24991-z"
  },
  capsuleSort: {
    label: "Boolean search of DNA file capsules — Banal et al. (2021)",
    url: "https://doi.org/10.1038/s41563-021-01021-3"
  },
  crispr: {
    label: "Cas9-enabled random access — Imburgia et al. (2025)",
    url: "https://doi.org/10.1038/s41467-025-61264-5"
  },
  adaptiveSampling: {
    label: "Adaptive sampling for DNA-storage access — Sokolovskii et al. (bioRxiv preprint)",
    url: "https://doi.org/10.1101/2024.11.05.622081"
  },
  pacbio: {
    label: "PacBio HiFi sequencing — official method description",
    url: "https://www.pacb.com/technology/hifi-sequencing/how-it-works/"
  },
  yazdi: {
    label: "Rewritable random-access DNA storage — Yazdi et al. (2015)",
    url: "https://doi.org/10.1038/srep14138"
  },
  ding: {
    label: "Soft-decision DNA-storage decoding — Ding et al. (2024)",
    url: "https://doi.org/10.1093/nsr/nwad229"
  },
  gimpel: {
    label: "Codec benchmark — Gimpel et al. (2026)",
    url: "https://doi.org/10.1038/s41467-026-70548-3"
  },
  stairLoop: {
    label: "DNA StairLoop — Yan et al. (2025)",
    url: "https://doi.org/10.1038/s41467-025-64230-3"
  },
  sustag: {
    label: "SUSTag-ORCtrL — Li et al. (2025)",
    url: "https://doi.org/10.1038/s41467-025-64293-2"
  },
  parallelEnzymatic: {
    label: "Parallel enzymatic synthesis chip — Jung et al. (2026)",
    url: "https://doi.org/10.1038/s41928-026-01662-9"
  },
  epiBits: {
    label: "Epigenetic-bit printing — Zhang et al. (2024)",
    url: "https://doi.org/10.1038/s41586-024-08040-5"
  },
  primordial: {
    label: "DNA store-and-compute engine — Chen et al. (2024)",
    url: "https://doi.org/10.1038/s41565-024-01771-6"
  },
  cassette: {
    label: "DNA cassette tape — Li et al. (2025)",
    url: "https://doi.org/10.1126/sciadv.ady3406"
  },
  singleMolecule: {
    label: "Assembly-free nanopore readout — Chen et al. (2025)",
    url: "https://doi.org/10.1038/s41467-025-65004-7"
  },
  compositeHedges: {
    label: "Composite Hedges Nanopores — Zhao et al. (2024)",
    url: "https://doi.org/10.1038/s41467-024-53455-3"
  },
  motifCaller: {
    label: "Motif Caller — Agarwal et al. (2025)",
    url: "https://doi.org/10.1038/s41598-025-22798-2"
  },
  sectorZero: {
    label: "SNIA Sector Zero v1.0 (2023)",
    url: "https://www.snia.org/standards/technology-standards-software/standards-portfolio/dna-data-storage-sector-zero"
  },
  stabilityStandard: {
    label: "SNIA DNA Stability Evaluation Method v1.0 (2024)",
    url: "https://www.snia.org/dnastability"
  },
  jpegDnaStandard: {
    label: "ISO/IEC DIS 25508-1 JPEG DNA (2026)",
    url: "https://www.iso.org/standard/90579.html"
  },
  isoOligo: {
    label: "ISO 20688-1:2020 — synthesized oligonucleotides",
    url: "https://www.iso.org/standard/68831.html"
  },
  isoGene: {
    label: "ISO 20688-2:2024 — synthesized DNA fragments",
    url: "https://www.iso.org/standard/75852.html"
  },
  isoMpsPrep: {
    label: "ISO 20397-1:2022 — MPS library preparation",
    url: "https://www.iso.org/standard/74054.html"
  },
  isoMpsData: {
    label: "ISO 20397-2:2021 — MPS data quality",
    url: "https://www.iso.org/standard/67895.html"
  },
  sniaPortfolio: {
    label: "SNIA standards portfolio",
    url: "https://www.snia.org/standards/technology-standards-software/standards-portfolio"
  }
};

const STAGE_SOURCE_IDS = {
  prepare: ["snia"],
  encode: ["snia", "fountain", "hedges"],
  design: ["fountain", "organick"],
  synthesize: ["synthesis"],
  preserve: ["grass"],
  retrieve: ["organick", "lin"],
  sequence: ["lopez", "organick"],
  reconstruct: ["lopez", "hedges"]
};

const METHOD_SOURCE_IDS = {
  prepare: {
    "opaque-package": ["fountain", "snia"],
    "self-describing": ["selfContained", "sectorOne"],
    "content-aware": ["jpegDna"],
    "encrypted-envelope": ["encryption", "fountain"]
  },
  encode: {
    "fixed-symbol": ["church", "snia"],
    "rotating-ternary": ["goldman"],
    fountain: ["fountain"],
    "algebraic-ecc": ["grass", "snia"],
    "indel-sync": ["hedges"]
  },
  design: {
    "generate-screen": ["fountain"],
    "constraint-built": ["yinYang"],
    "in-band-index": ["goldman", "snia"],
    "primer-address": ["organick", "yazdi"],
    orthogonality: ["organick"]
  },
  synthesize: {
    phosphoramidite: ["phosphoramidite"],
    "array-chemical": ["arraySynthesis"],
    tdt: ["tdt"],
    "motif-ligation": ["motif"]
  },
  preserve: {
    "dry-state": ["dryState"],
    silica: ["grass"],
    "solid-carrier": ["cellulose"],
    capsules: ["microcapsules", "capsuleSort"],
    biological: ["biological"]
  },
  retrieve: {
    "primer-pcr": ["organick"],
    "hybrid-capture": ["lin", "hybridSearch"],
    "capsule-sort": ["capsuleSort", "microcapsules"],
    crispr: ["crispr"],
    "adaptive-sampling": ["adaptiveSampling"]
  },
  sequence: {
    "short-read-sbs": ["organick"],
    nanopore: ["lopez"],
    "smrt-hifi": ["pacbio", "ding"],
    sanger: ["yazdi"]
  },
  reconstruct: {
    "clustered-consensus": ["lopez"],
    "block-ecc": ["grass"],
    fountain: ["fountain"],
    "indel-sync": ["hedges"],
    "reliability-aware": ["ding"]
  }
};

const METHOD_FAMILIES = {
  prepare: [
    {
      slug: "opaque-package", name: "Opaque lossless package",
      summary: "Bundle arbitrary files into one deterministic archive bitstream, normally compressing before DNA coding.",
      use: "Heterogeneous files need bit-exact recovery through a codec-agnostic input.",
      tradeoff: "Already-compressed media gains little; one residual error can break decompression.",
      terms: 'preprocessing OR compression OR tarball OR "lossless compression"'
    },
    {
      slug: "self-describing", name: "Self-describing archive",
      summary: "Store format, parameters, hashes, and file structure beside the payload so a future reader can interpret it.",
      use: "Long-lived archives must survive software and organizational change.",
      tradeoff: "Metadata costs capacity and becomes a critical protection target.",
      terms: '"self-contained" OR "self-explanatory" OR metadata OR manifest OR "file format"'
    },
    {
      slug: "content-aware", name: "Content-aware source coding",
      summary: "Use a media-specific codec co-designed for DNA cost, constraints, or progressive reconstruction.",
      use: "Large, known media collections permit format-specific optimization.",
      tradeoff: "It reduces generality; lossy variants cannot reproduce the original bytes.",
      terms: '"JPEG DNA" OR "image coding" OR "source coding" OR "progressive coding" OR "content-aware"'
    },
    {
      slug: "encrypted-envelope", name: "Cryptographic payload envelope",
      summary: "Compress first, then encrypt the payload before transcoding it into DNA symbols.",
      use: "The archive contains confidential or regulated information.",
      tradeoff: "Key loss is terminal, and ciphertext cannot be compressed further.",
      terms: 'encryption OR cryptography OR AES OR confidentiality OR "secure storage"'
    }
  ],
  encode: [
    {
      slug: "fixed-symbol", name: "Fixed symbol mapping",
      summary: "Use a static lookup to convert bits or short symbols directly into nucleotide choices.",
      use: "Transparency and low computational cost matter most.",
      tradeoff: "Unconstrained mappings can create GC imbalance, repeats, and unwanted motifs.",
      terms: '"binary mapping" OR "quaternary mapping" OR "bit-to-base" OR transcoding'
    },
    {
      slug: "rotating-ternary", name: "Rotating ternary mapping",
      summary: "Convert bytes to trits and let each trit choose a base different from the preceding base.",
      use: "Simple deterministic homopolymer avoidance is needed.",
      tradeoff: "Its density ceiling is lower before indexing and protection overhead.",
      terms: 'ternary OR "rotating code" OR "rotating encoding" OR Huffman OR homopolymer'
    },
    {
      slug: "fountain", name: "Rateless fountain protection",
      summary: "Generate seeded combinations of source blocks so any sufficiently large valid subset can recover the file.",
      use: "Whole-oligo dropout is the dominant failure mode.",
      tradeoff: "Recovery is probabilistic and seeds, screening, and redundancy add overhead.",
      terms: '"fountain code" OR "DNA Fountain" OR "Luby transform" OR rateless OR dropout'
    },
    {
      slug: "algebraic-ecc", name: "Algebraic block and erasure codes",
      summary: "Use fixed parity such as Reed–Solomon or LDPC within and across oligos.",
      use: "The expected error envelope is measurable and predictable redundancy is preferred.",
      tradeoff: "Parity reduces density and ordinary block codes do not restore synchronization after indels.",
      terms: '"Reed Solomon" OR LDPC OR "erasure code" OR "outer code" OR "inner code" OR concatenated'
    },
    {
      slug: "indel-sync", name: "Indel-aware synchronization codes",
      summary: "Encode position-dependent redundancy so a decoder can recover synchronization after insertions or deletions.",
      use: "Nanopore or degraded-DNA channels produce substantial indel errors.",
      tradeoff: "Code rate falls and decoding requires a more expensive path search.",
      terms: 'HEDGES OR "indel correcting" OR "insertion deletion" OR synchronization OR "edit error"'
    }
  ],
  design: [
    {
      slug: "generate-screen", name: "Generate-and-screen design",
      summary: "Produce many candidate sequences and reject those violating GC, homopolymer, or motif limits.",
      use: "A randomized encoder can cheaply generate replacement candidates.",
      tradeoff: "Yield and runtime vary, especially under strict constraints.",
      terms: 'screening OR "sequence screening" OR rejection OR homopolymer OR "GC content"'
    },
    {
      slug: "constraint-built", name: "Constraint-by-construction",
      summary: "Use finite-state or combinatorial rules that produce only sequences in an allowed molecular codebook.",
      use: "Hard biochemical limits and predictable candidate yield are important.",
      tradeoff: "The allowed codebook reduces density and grows complex as constraints accumulate.",
      terms: '"constrained code" OR "constraint-based code" OR "Yin-Yang codec" OR "codeword design"'
    },
    {
      slug: "in-band-index", name: "In-band positional indexing",
      summary: "Reserve bases in every oligo for file and strand identifiers used to regroup unordered reads.",
      use: "A file is distributed across many short oligos in an unordered pool.",
      tradeoff: "Indexes consume payload capacity, and an index error can misassign a readable strand.",
      terms: 'indexing OR "strand index" OR "sequence index" OR barcode OR addressing OR reassembly'
    },
    {
      slug: "primer-address", name: "Primer-addressed object layout",
      summary: "Flank every oligo in an object with an orthogonal primer pair for selective PCR retrieval.",
      use: "File-level random access should avoid sequencing the whole archive.",
      tradeoff: "Primer space is finite and cross-talk, bias, and collisions limit scaling.",
      terms: '"random access" OR "primer address" OR "primer library" OR "selective amplification" OR PCR'
    },
    {
      slug: "orthogonality", name: "Pool-wide orthogonality optimization",
      summary: "Jointly score primers and payloads for melting temperature, structure, distance, and cross-hybridization.",
      use: "Large mixed pools need reliable amplification with few unintended interactions.",
      tradeoff: "Search becomes expensive and the usable sequence space shrinks as the pool grows.",
      terms: 'orthogonality OR "cross-hybridization" OR "secondary structure" OR "melting temperature"'
    }
  ],
  synthesize: [
    {
      slug: "phosphoramidite", name: "Column phosphoramidite",
      summary: "Add protected nucleotides cycle-by-cycle to immobilized strands, then cleave and purify them.",
      use: "Small custom libraries need established chemistry and useful per-sequence yield.",
      tradeoff: "Parallelism is low and truncation errors, reagent use, and chemical waste accumulate.",
      terms: 'phosphoramidite OR "solid phase synthesis" OR "oligonucleotide synthesis"'
    },
    {
      slug: "array-chemical", name: "Arrayed chemical synthesis",
      summary: "Address array sites optically, electrically, or by inkjet so millions of different oligos grow in parallel.",
      use: "Large diverse pools prioritize write throughput over mass per sequence.",
      tradeoff: "Yield per sequence is low and representation bias or dropout is stronger.",
      terms: 'microarray OR photolithography OR "electrode array" OR "electrochemical synthesis"'
    },
    {
      slug: "tdt", name: "TdT enzymatic synthesis",
      summary: "Use terminal deoxynucleotidyl transferase in controlled nucleotide-addition cycles.",
      use: "Aqueous, potentially faster, lower-waste writing is valuable.",
      tradeoff: "Extension control, enzyme engineering, and monomers are less mature than chemical synthesis.",
      terms: 'TdT OR "terminal deoxynucleotidyl transferase" OR "enzymatic synthesis"'
    },
    {
      slug: "motif-ligation", name: "Motif ligation",
      summary: "Select reusable DNA motifs and enzymatically ligate them instead of synthesizing every base anew.",
      use: "A standard molecular alphabet can reduce de novo synthesis cycles.",
      tradeoff: "It needs a designed motif library and more complex decoding and validation.",
      terms: 'motif OR ligation OR "bridge oligonucleotide assembly"'
    }
  ],
  preserve: [
    {
      slug: "dry-state", name: "Dry-state bulk DNA",
      summary: "Dehydrate or lyophilize DNA, often with stabilizers, and rehydrate it for later access.",
      use: "Simple inexpensive holding or transport is more important than maximum lifetime.",
      tradeoff: "Humidity, oxidation, UV exposure, and rehydration remain important failure modes.",
      terms: 'lyophilization OR dehydrated OR trehalose OR "dry state"'
    },
    {
      slug: "silica", name: "Silica encapsulation",
      summary: "Seal DNA in an inorganic matrix that limits water and chemical exposure, then release it for reading.",
      use: "Long-term, rarely accessed ambient archives need strong isolation.",
      tradeoff: "Encapsulation and release add latency, material overhead, and physical volume.",
      terms: 'silica OR glass OR encapsulation'
    },
    {
      slug: "solid-carrier", name: "Adsorbed solid carriers",
      summary: "Bind DNA reversibly to a dry carrier such as cellulose and later elute it.",
      use: "Low-cost cartridges and simple physical handling matter.",
      tradeoff: "Environmental isolation is weaker than encapsulation and the carrier adds bulk.",
      terms: 'cellulose OR paper OR adsorption OR carrier'
    },
    {
      slug: "capsules", name: "Addressable microcapsules",
      summary: "Compartmentalize files in capsules that can also carry labels for later retrieval.",
      use: "Repeated file-level access and physical organization are important.",
      tradeoff: "Fabrication is complex and density falls as sorting and capsule overhead grow.",
      terms: 'microcapsule OR capsule OR compartmentalized'
    },
    {
      slug: "biological", name: "Biological repositories",
      summary: "Clone encoded DNA into plasmids or genomes maintained in living cells.",
      use: "Cheap physical replication and microbiological infrastructure are available.",
      tradeoff: "Mutation, selection, biosafety, slow access, and low effective density complicate guarantees.",
      terms: 'plasmid OR bacteria OR "living cells" OR "in vivo"'
    }
  ],
  retrieve: [
    {
      slug: "primer-pcr", name: "Primer-addressed PCR",
      summary: "Use a file-specific primer pair to selectively amplify strands with matching addresses.",
      use: "Exact-file retrieval should work with standard laboratory equipment.",
      tradeoff: "Bias, cross-talk, finite primer space, and aliquot consumption limit repeated access.",
      terms: '(PCR OR primer) AND ("random access" OR retrieval)'
    },
    {
      slug: "hybrid-capture", name: "Hybridization capture",
      summary: "Bind complementary query probes and physically separate matching molecules, often with magnetic beads.",
      use: "Reusable retrieval or content search should avoid whole-pool PCR.",
      tradeoff: "Hybridization can be slow and sensitive to off-target binding and temperature.",
      terms: '(hybridization OR "magnetic bead" OR affinity) AND (retrieval OR search)'
    },
    {
      slug: "capsule-sort", name: "Capsule sorting",
      summary: "Select externally barcoded file capsules through fluorescent or Boolean-label sorting.",
      use: "Metadata queries should leave non-selected files intact.",
      tradeoff: "Packaging overhead, limited optical channels, and sorting equipment add complexity.",
      terms: '(capsule OR encapsulation) AND ("Boolean search" OR sorting OR "random access")'
    },
    {
      slug: "crispr", name: "CRISPR-guided enrichment",
      summary: "Use guide-programmed Cas nucleases to cut or enrich molecules carrying a requested address.",
      use: "Rapid exact or multiplex targeting should avoid large primer panels.",
      tradeoff: "PAM requirements, off-targets, and limited system-scale validation constrain deployment.",
      terms: '(CRISPR OR Cas9) AND ("random access" OR retrieval OR enrichment)'
    },
    {
      slug: "adaptive-sampling", name: "Nanopore adaptive sampling",
      summary: "Compare early nanopore signal with targets and electronically reject unwanted molecules in real time.",
      use: "PCR-free, dynamically switchable access to sufficiently long molecules is needed.",
      tradeoff: "Short storage oligos are poorly suited and enrichment occurs only during sequencing.",
      terms: '"adaptive sampling" OR "selective sequencing" OR nanopore'
    }
  ],
  sequence: [
    {
      slug: "short-read-sbs", name: "Short-read SBS",
      summary: "Identify bases cycle-by-cycle with fluorescent reversible terminators across amplified clusters.",
      use: "Large pools of short oligos need high-throughput, low-error readout.",
      tradeoff: "Reads are short and batch instruments introduce amplification and cluster bias.",
      terms: 'Illumina OR "sequencing by synthesis"'
    },
    {
      slug: "nanopore", name: "Nanopore current sensing",
      summary: "Measure ionic-current changes as a molecule passes a pore, then infer bases with a neural caller.",
      use: "Portable, real-time, selective, or long-molecule readout matters.",
      tradeoff: "Indels are more context-dependent and short oligos may require concatenation.",
      terms: 'nanopore OR MinION OR basecalling'
    },
    {
      slug: "smrt-hifi", name: "Circular-consensus SMRT",
      summary: "Read a circularized molecule repeatedly and combine passes into one accurate long read.",
      use: "Long composite molecules need both read length and single-molecule accuracy.",
      tradeoff: "Instrumentation is costly and short-oligo pools use its capacity inefficiently.",
      terms: 'PacBio OR SMRT OR "circular consensus" OR HiFi'
    },
    {
      slug: "sanger", name: "Capillary chain termination",
      summary: "Separate terminated fragments by capillary electrophoresis to read one clone or amplicon.",
      use: "A small proof-of-concept or orthogonal validation needs a simple accurate read.",
      tradeoff: "Throughput is far too low for large pooled archives.",
      terms: 'Sanger OR "capillary sequencing"'
    }
  ],
  reconstruct: [
    {
      slug: "clustered-consensus", name: "Clustered consensus",
      summary: "Group reads from the same oligo, align them, and infer one sequence by voting or probability.",
      use: "Several noisy physical copies of each strand are available.",
      tradeoff: "Coverage is required and similar strands or contaminants can be merged.",
      terms: 'clustering OR consensus OR "multiple sequence alignment"'
    },
    {
      slug: "block-ecc", name: "Algebraic block correction",
      summary: "Use structured parity such as Reed–Solomon, BCH, or LDPC to repair erroneous or missing symbols.",
      use: "The error budget is known and exact recovery is required.",
      tradeoff: "Fixed redundancy lowers density and ordinary block codes need help with indels.",
      terms: '"Reed-Solomon" OR LDPC OR BCH OR "block code"'
    },
    {
      slug: "fountain", name: "Fountain recovery",
      summary: "Reconstruct the file from any sufficiently large subset of droplets, treating missing strands as erasures.",
      use: "Dropout in a large unordered pool is the main failure mode.",
      tradeoff: "Recovery has a threshold and base-level errors still need separate protection.",
      terms: 'fountain OR "Luby transform" OR rateless OR Raptor'
    },
    {
      slug: "indel-sync", name: "Indel-synchronizing codes",
      summary: "Use hashes, markers, or watermark-like state to guide decoding through insertions and deletions.",
      use: "Nanopore or damaged molecules create meaningful indel rates.",
      tradeoff: "Code rate falls and path-search decoding becomes more expensive.",
      terms: 'HEDGES OR indel OR "insertion deletion" OR synchronization'
    },
    {
      slug: "reliability-aware", name: "Reliability-aware decoding",
      summary: "Use quality scores or learned channel models so uncertain positions contribute soft decisions.",
      use: "Coverage is low or errors vary strongly across positions and reads.",
      tradeoff: "Computation and calibration increase, with sensitivity to model drift.",
      terms: '("soft-decision" OR "deep learning" OR probabilistic) AND (decoding OR reconstruction)'
    }
  ]
};

const REVIEWED_ON = "25 August 2026";

const STATE_OF_ART = {
  prepare: [
    {
      slug: "self-contained", name: "Self-contained archive", year: 2021, status: "Peer-reviewed proof of concept",
      result: "The archive carries data and the information needed to interpret it, reducing dependence on an external decoding tool.",
      significance: "Long-lived storage needs format and decoding context to survive with the payload.",
      boundary: "This is a system design, not an interoperability standard; its metadata remains a protected part of the archive.",
      sourceIds: ["selfContained"]
    },
    {
      slug: "layered-encryption", name: "Layered molecular encryption", year: 2024, status: "Peer-reviewed proof of concept",
      result: "A medical report was protected with Blowfish, DNA-sequence encoding, and a molecular-weight key read by mass spectrometry.",
      significance: "It treats confidentiality as part of archive preparation rather than a later access-control layer.",
      boundary: "The paper demonstrates limited-size data and requires both mass spectrometry and sequencing; it is not a large-scale security benchmark.",
      sourceIds: ["encryption"]
    }
  ],
  encode: [
    {
      slug: "codec-benchmark", name: "Common codec benchmark", year: 2026, status: "Peer-reviewed comparative benchmark",
      result: "Six published codecs were tested under shared in-silico and in-vitro conditions; two synthesis workflows demonstrated 43 and 13 EB/g with existing codecs.",
      significance: "It supplies a controlled baseline for codec comparison instead of comparing isolated headline results.",
      boundary: "The six codecs were selected by October 2023 and tested mainly in a short-oligo, Illumina-oriented workflow with kilobyte inputs.",
      sourceIds: ["gimpel"]
    },
    {
      slug: "stairloop", name: "StairLoop error protection", year: 2025, status: "Peer-reviewed wet-lab study",
      result: "A staircase interleaver with iterative soft decoding recovered data from electrochemical-synthesis experiments with high error and dropout.",
      significance: "The code targets emerging writers whose errors are both high and uneven across the pool.",
      boundary: "The evidence comes from the authors' synthesis and decoding setup; cross-platform validation remains limited.",
      sourceIds: ["stairLoop"]
    }
  ],
  design: [
    {
      slug: "signal-designed-tags", name: "Signal-designed molecular tags", year: 2025, status: "Peer-reviewed wet-lab study",
      result: "SUSTag-ORCtrL designed 96- and 384-plex tags for direct nanopore-signal classification and used them for PCR-free selective readout.",
      significance: "Addresses are separated in raw signal space, not only by nucleotide distance.",
      boundary: "The classifier required domain adaptation to new runs and was demonstrated with one tag and nanopore workflow.",
      sourceIds: ["sustag"]
    },
    {
      slug: "primer-address-space", name: "Large primer-addressed library", year: 2018, status: "Peer-reviewed system demonstration",
      result: "Orthogonal primer addresses enabled random access to 35 files in a pool containing more than 13 million oligos.",
      significance: "It remains a reference physical scale for primer-addressed oligo libraries.",
      boundary: "Retrieval is PCR-based, so primer validation and crosstalk management grow harder with the address space.",
      sourceIds: ["organick"]
    }
  ],
  synthesize: [
    {
      slug: "parallel-enzyme-chip", name: "Parallel enzymatic synthesis chip", year: 2026, status: "Peer-reviewed device demonstration",
      result: "A CMOS chip with 256 programmable sites synthesized up to 64 distinct 38–39 nt sequences and encoded a 169-byte text.",
      significance: "It couples spatially programmable enzymatic writing with semiconductor control.",
      boundary: "The feature sequences and payload were small; the authors describe parallel enzymatic synthesis as early-stage.",
      sourceIds: ["parallelEnzymatic"]
    },
    {
      slug: "epigenetic-printing", name: "Parallel epigenetic-bit printing", year: 2024, status: "Peer-reviewed system demonstration",
      result: "Premade templates and 700 movable types wrote about 275,000 bits as methylation patterns, with 350 bits written per reaction.",
      significance: "New payloads are printed as modifications instead of synthesized base by base.",
      boundary: "The workflow needs prepared templates and types plus methylation-aware nanopore decoding; it is not sequence-only storage.",
      sourceIds: ["epiBits"]
    }
  ],
  preserve: [
    {
      slug: "colloid-store", name: "Colloid store-and-compute medium", year: 2024, status: "Peer-reviewed system demonstration",
      result: "DNA on soft dendritic colloids was lyophilized, repeatedly transcribed, and evaluated with accelerated ageing.",
      significance: "The same material supports preservation, non-destructive access, and molecular operations.",
      boundary: "Lifetime values are projections from accelerated ageing and depend on the specialized colloid and transcription workflow.",
      sourceIds: ["primordial"]
    },
    {
      slug: "cassette-tape", name: "Addressable DNA cassette tape", year: 2025, status: "Peer-reviewed system prototype",
      result: "A tape-and-drive prototype automated file addressing, recovery, removal, and redeposition; the stored image was then reconstructed after sequencing.",
      significance: "It treats preserved DNA as a catalogued, seekable physical medium rather than a set of isolated tubes.",
      boundary: "The demonstrated payload remained small; partition capacity and long retention are projections rather than field-aged archive results.",
      sourceIds: ["cassette"]
    }
  ],
  retrieve: [
    {
      slug: "cas9-access", name: "Cas9 random access and search", year: 2025, status: "Peer-reviewed wet-lab study",
      result: "One-pot Cas9 access selected files from a 1.6-million-sequence, 25-file pool; Cas9 targets also supported similarity search.",
      significance: "Selection is programmable without assigning a separate PCR primer pair to every file.",
      boundary: "Targets must be designed into the archive; similarity search trades precision and remains a research system.",
      sourceIds: ["crispr"]
    },
    {
      slug: "thermoconfined-access", name: "Thermoconfined capsule access", year: 2023, status: "Peer-reviewed material study",
      result: "Thermoresponsive microcapsules supported repeated multiplex PCR access and reduced amplification bias tenfold against non-compartmentalized PCR.",
      significance: "Physical compartments limit crosstalk while preserving the source files for repeated access.",
      boundary: "Encapsulation adds preparation, volume, and sorting requirements that the authors identify as scaling constraints.",
      sourceIds: ["microcapsules"]
    }
  ],
  sequence: [
    {
      slug: "assembly-free-readout", name: "Assembly-free low-coverage readout", year: 2025, status: "Peer-reviewed wet-lab proof of concept",
      result: "Medium-length plasmid codewords were recovered error-free from nanopore reads at low coverage without assembling reads into a reference first.",
      significance: "Molecule and code co-design moves nanopore readout toward fast, near-single-molecule recovery.",
      boundary: "The wet-lab payload was kilobyte-scale and used engineered 6–43 kb plasmids with a tailored PNC-LDPC decoder.",
      sourceIds: ["singleMolecule"]
    },
    {
      slug: "rapid-nanopore-codec", name: "Rapid indel-tolerant nanopore readout", year: 2024, status: "Peer-reviewed wet-lab study",
      result: "Composite Hedges Nanopores recovered representative text and image files after 20 and 120 minutes of nanopore sequencing.",
      significance: "The codec accepts noisier reads to reduce the time and coverage needed for portable readout.",
      boundary: "The demonstrations stored 219- and 4,109-byte files and depend on a composite alphabet plus a tailored decoder.",
      sourceIds: ["compositeHedges"]
    }
  ],
  reconstruct: [
    {
      slug: "direct-motif-caller", name: "Direct raw-signal motif calling", year: 2025, status: "Peer-reviewed computational study",
      result: "Motif Caller maps nanopore current directly to 25-nt motif identities and recovered more motifs per read than basecall-then-search baselines.",
      significance: "It removes a base-level intermediate step for motif-based storage.",
      boundary: "The model was trained on an eight-motif library; larger libraries need more training data and likely retraining.",
      sourceIds: ["motifCaller"]
    },
    {
      slug: "soft-decision", name: "Soft-decision reconstruction", year: 2024, status: "Peer-reviewed wet-lab and simulation study",
      result: "Sequencing and alignment confidence values doubled Reed–Solomon error-correction capability in the reported pipeline.",
      significance: "The decoder uses uncertainty that hard consensus normally discards.",
      boundary: "The gain is pipeline- and error-model-dependent and requires more computation and calibration than hard decisions.",
      sourceIds: ["ding"]
    }
  ]
};

const STANDARD_RECORDS = {
  sectorZero: {
    slug: "sector-zero", name: "DNA Data Storage Sector Zero v1.0", issuer: "SNIA", status: "Published standard", date: "11 November 2023",
    scope: "Defines one bootstrap oligo carrying the archive writer and the codec identifier needed to find and decode Sector One.",
    excludes: "It does not define payload codec behaviour, synthesis, sequencing, or performance requirements.",
    sourceIds: ["sectorZero"]
  },
  sectorOne: {
    slug: "sector-one", name: "DNA Data Storage Sector One v1.0", issuer: "SNIA", status: "Published standard", date: "11 November 2023",
    scope: "Defines archive metadata for recovering logical structure and data, including codec information and sequencing handoff fields.",
    excludes: "Codec parameters and laboratory methods remain implementation-specific.",
    sourceIds: ["sectorOne"]
  },
  stability: {
    slug: "stability-method", name: "DNA Stability Evaluation Method v1.0", issuer: "SNIA", status: "Published standard", date: "12 September 2024",
    scope: "Defines accelerated ageing, intact-strand measurement, and a 25 °C half-life metric for DNA containment systems.",
    excludes: "It rates molecular protection by the container; it does not qualify codecs, retrieval, sequencing, or complete archives.",
    sourceIds: ["stabilityStandard"]
  },
  jpegDna: {
    slug: "jpeg-dna", name: "ISO/IEC DIS 25508-1 — JPEG DNA Part 1", issuer: "ISO/IEC JTC 1/SC 29", status: "Draft International Standard", date: "DIS ballot opened 2 July 2026",
    scope: "Defines syntax and decompression for image samples represented as nucleotide sequences, including biochemical constraints and storage noise.",
    excludes: "It is still under development and covers image coding, not a general arbitrary-file archive format.",
    sourceIds: ["jpegDnaStandard"]
  },
  oligoSynthesis: {
    slug: "iso-oligo-synthesis", name: "ISO 20688-1:2020", issuer: "ISO/TC 276/SC 1", status: "Published International Standard", date: "Published February 2020 · confirmed June 2025",
    scope: "Sets minimum production and quality-control requirements for synthesized oligonucleotides, nominally up to 250 bases.",
    excludes: "It is a general biotechnology standard; it does not define DNA-storage throughput, encoding, writer interfaces, or archive-level recovery.",
    sourceIds: ["isoOligo"]
  },
  geneSynthesis: {
    slug: "iso-gene-synthesis", name: "ISO 20688-2:2024", issuer: "ISO/TC 276/SC 1", status: "Published International Standard", date: "15 March 2024",
    scope: "Sets production and quality-control requirements for synthesized double-stranded fragments, genes, and genomes below 10 Mbp.",
    excludes: "It applies only when a DNA-storage implementation uses those longer double-stranded products, not ordinary short-oligo pools.",
    sourceIds: ["isoGene"]
  },
  mpsPrep: {
    slug: "iso-mps-preparation", name: "ISO 20397-1:2022", issuer: "ISO/TC 276/SC 1", status: "Published; to be revised", date: "Revision status set June 2026",
    scope: "Gives general requirements for nucleic-acid sample assessment, sequencing-library preparation, and library quality assessment.",
    excludes: "It is not DNA-storage-specific and does not define a storage reader, basecaller, or minimum archive-recovery performance.",
    sourceIds: ["isoMpsPrep"]
  },
  mpsData: {
    slug: "iso-mps-data", name: "ISO 20397-2:2021", issuer: "ISO/TC 276/SC 1", status: "Published; to be revised", date: "Revision status set June 2026",
    scope: "Gives general requirements for quality assessment and control of massively parallel sequencing data after raw-data generation.",
    excludes: "It is not DNA-storage-specific and explicitly excludes de novo assembly; it does not specify archive decoding.",
    sourceIds: ["isoMpsData"]
  }
};

const STANDARD_STAGE_MAP = {
  prepare: [
    { id: "sectorOne", relevance: "Direct: standard archive metadata, file structure, and decoder context are prepared with the payload." },
    { id: "sectorZero", relevance: "Direct: the bootstrap record identifies who wrote the archive and how to reach its metadata." },
    { id: "jpegDna", relevance: "Direct for images: source coding and nucleotide representation are defined together in one draft format." }
  ],
  encode: [
    { id: "jpegDna", relevance: "Direct for images: defines a nucleotide representation and decompression process." },
    { id: "sectorZero", relevance: "Partial: identifies the chosen codec but does not define how that codec works." }
  ],
  design: [
    { id: "sectorZero", relevance: "Partial: fixes the bootstrap payload to one oligo and therefore constrains that oligo's design." }
  ],
  synthesize: [
    { id: "oligoSynthesis", relevance: "Adjacent but directly applicable: covers production and quality control of the short oligos used by most DNA-storage systems." },
    { id: "geneSynthesis", relevance: "Adjacent and conditional: applies when the storage medium is produced as longer double-stranded fragments, genes, or plasmids." }
  ],
  preserve: [
    { id: "stability", relevance: "Direct: supplies a common procedure and metric for comparing containment systems." }
  ],
  retrieve: [],
  sequence: [
    { id: "mpsPrep", relevance: "Adjacent: standardizes general library-preparation and quality-assessment practice before massively parallel sequencing." },
    { id: "mpsData", relevance: "Adjacent: standardizes general sequencing-data quality assessment after raw-data generation." },
    { id: "sectorOne", relevance: "Partial: carries sequencing handoff metadata but does not standardize chemistry, instruments, or basecalling." }
  ],
  reconstruct: [
    { id: "sectorZero", relevance: "Direct: lets a reader discover the codec needed to decode archive metadata." },
    { id: "sectorOne", relevance: "Direct: carries codec parameters, logical structure, and integrity information needed for reconstruction." },
    { id: "jpegDna", relevance: "Direct for JPEG DNA images: defines the corresponding decompression process." }
  ]
};

const STANDARD_GAPS = {
  retrieve: {
    slug: "coverage-gap", name: "No retrieval standard identified", issuer: "DNA-storage standards catalogues", status: "Coverage gap", date: REVIEWED_ON,
    relevance: "No DNA-storage-specific formal document in the reviewed SNIA or ISO/JPEG records defines PCR, capture, sorting, Cas-based access, or adaptive sampling.",
    scope: "Sector metadata can describe an archive, but it does not standardize the molecular operation used to select a file.",
    excludes: "Research protocols and technical white papers are not presented here as standards.",
    sourceIds: ["sniaPortfolio", "sectorOne"]
  }
};

const STAGE_BY_SLUG = Object.fromEntries(STAGES.map((stage, index) => [
  stage.slug,
  { ...stage, index, methods: METHOD_FAMILIES[stage.slug], frontier: STATE_OF_ART[stage.slug] }
]));
const LEGACY_STAGE_SLUGS = { package: "prepare", write: "synthesize", access: "retrieve" };
const LEGACY_HASHES = { "#stage-package": "#stage-prepare", "#stage-write": "#stage-synthesize", "#stage-access": "#stage-retrieve" };

const DNA_STORAGE_QUERY = '("DNA data storage"[Title/Abstract] OR "DNA-based data storage"[Title/Abstract] OR "molecular data storage"[Title/Abstract])';
const OTHER_SIGNAL = "__other__";
let lastPubMedRequest = 0;

class PubMedSource {
  constructor(query, pageSize = 10) {
    this.query = query;
    this.pageSize = pageSize;
    this.offset = 0;
    this.total = 0;
    this.loaded = 0;
  }

  endpoint(path, params) {
    params.set("tool", "dna_storage_navigator");
    return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${path}?${params}`;
  }

  searchUrl(query, start = 0, size = this.pageSize) {
    const params = new URLSearchParams({
      db: "pubmed",
      term: query,
      retmode: "json",
      retstart: String(start),
      retmax: String(size),
      sort: "pub date"
    });
    return this.endpoint("esearch.fcgi", params);
  }

  fetchUrl(ids) {
    return this.endpoint("efetch.fcgi", new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      rettype: "abstract",
      retmode: "xml"
    }));
  }

  sourceUrl() {
    return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(this.query)}`;
  }

  async request(url, type, signal) {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    signal?.addEventListener("abort", cancel, { once: true });

    try {
      await this.throttle(signal);
      let response = await fetch(url, { signal: controller.signal });
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1100));
        lastPubMedRequest = Date.now();
        response = await fetch(url, { signal: controller.signal });
      }
      if (!response.ok) throw new Error(`PubMed returned ${response.status}`);
      return type === "xml" ? response.text() : response.json();
    } catch (error) {
      if (timedOut) throw new Error("PubMed timed out");
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  }

  async throttle(signal) {
    const delay = Math.max(0, 350 - (Date.now() - lastPubMedRequest));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (signal?.aborted) {
      const error = new Error("Request aborted");
      error.name = "AbortError";
      throw error;
    }
    lastPubMedRequest = Date.now();
  }

  async next(signal) {
    const data = await this.request(this.searchUrl(this.query, this.offset), "json", signal);
    const search = data.esearchresult;
    if (!search || search.error || !Array.isArray(search.idlist)) throw new Error(search?.error || "PubMed returned an invalid search response");
    const ids = search.idlist;
    this.total = Number(search.count || 0);
    const results = ids.length
      ? this.parse(await this.request(this.fetchUrl(ids), "xml", signal))
      : [];
    this.offset += ids.length;
    this.loaded += ids.length;
    return {
      results,
      total: this.total,
      loaded: this.loaded,
      hasMore: ids.length > 0 && this.offset < this.total
    };
  }

  parse(text) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("PubMed returned invalid XML");
    return [...xml.querySelectorAll("PubmedArticle")].map(record => {
      const value = selector => record.querySelector(selector)?.textContent.trim() || "";
      const identifier = type => [...record.querySelectorAll("PubmedData ArticleId")]
        .find(node => node.getAttribute("IdType") === type)?.textContent.trim() || "";
      const authors = [...record.querySelectorAll("AuthorList > Author")].map(author =>
        author.querySelector("CollectiveName")?.textContent.trim() ||
        [author.querySelector("ForeName")?.textContent, author.querySelector("LastName")?.textContent]
          .filter(Boolean).join(" ")
      ).filter(Boolean).join(", ");
      const abstractText = [...record.querySelectorAll("Abstract AbstractText")].map(section => {
        const label = section.getAttribute("Label");
        return `${label ? `${label}: ` : ""}${section.textContent.trim()}`;
      }).join(" ");
      const medlineDate = value("JournalIssue PubDate MedlineDate");
      const pubYear = value("JournalIssue PubDate Year") || value("ArticleDate Year") ||
        value("DateCompleted Year") || medlineDate.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
      const doi = identifier("doi") || [...record.querySelectorAll("ELocationID")]
        .find(node => node.getAttribute("EIdType") === "doi")?.textContent.trim() || "";
      return {
        id: value("MedlineCitation > PMID"),
        pmid: value("MedlineCitation > PMID"),
        pmcid: identifier("pmc"),
        source: "MED",
        title: value("ArticleTitle"),
        abstractText,
        authorString: authors,
        journalTitle: value("Journal > Title"),
        pubYear,
        firstPublicationDate: pubYear,
        doi,
        pubTypeList: { pubType: [...record.querySelectorAll("PublicationTypeList PublicationType")].map(node => node.textContent.trim()) }
      };
    });
  }

  async activity(signal) {
    const completeYear = new Date().getFullYear() - 1;
    const recent = [completeYear - 2, completeYear];
    const previous = [completeYear - 5, completeYear - 3];
    const count = async ([start, end]) => {
      const dated = `${this.query} AND ${start}:${end}[dp]`;
      const data = await this.request(this.searchUrl(dated, 0, 0), "json", signal);
      return Number(data.esearchresult?.count || 0);
    };
    const recentCount = await count(recent);
    const previousCount = await count(previous);
    return { recent, previous, recentCount, previousCount };
  }
}

class ResearchPage {
  constructor() {
    this.list = document.querySelector("#paper-list");
    this.status = document.querySelector("#result-status");
    this.loadMore = document.querySelector("#load-more");
    this.retry = document.querySelector("#retry");
    this.stageSelect = document.querySelector("#stage-select");
    this.yearSelect = document.querySelector("#year-filter");
    this.signalTerms = document.querySelector("#signal-terms");
    this.subprocessMenu = document.querySelector("#subprocess-menu");
    this.subprocessSummary = document.querySelector("#subprocess-summary");
    this.researchTabs = document.querySelector(".research-tabs");
    this.compactSubprocessMenu = matchMedia("(max-width: 760px)");
    this.signalPanel = document.querySelector("#signal-panel");
    this.methodPanel = document.querySelector("#method-panel");
    this.methodList = document.querySelector("#method-list");
    this.methodSummary = document.querySelector("#method-summary");
    this.methodSources = document.querySelector("#method-sources");
    this.paperPanel = document.querySelector("#papers");
    this.referenceIndexPanel = document.querySelector("#reference-index-panel");
    this.referenceList = document.querySelector("#reference-list");
    this.referencePanel = document.querySelector("#reference-panel");
    this.referenceSources = document.querySelector("#reference-sources");
    this.stagePicker = document.querySelector(".stage-picker");
    this.trendLayout = document.querySelector("#trend-layout");
    this.aboutView = document.querySelector("#about-view");
    this.aboutTermIndex = document.querySelector("#about-term-index");
    this.sectionLink = document.querySelector("#section-link");
    this.brandTitle = document.querySelector("#research-brand-title");
    this.results = [];
    this.activeSignal = "";
    this.activeYear = "";
    this.total = 0;
    this.rawLoaded = 0;
    this.hasMore = false;
    this.controller = null;
    this.retryMode = "initial";
  }

  mount() {
    this.syncSubprocessMenu();
    this.compactSubprocessMenu.addEventListener("change", () => this.syncSubprocessMenu());
    this.stageSelect.addEventListener("change", () => this.navigate(this.stageSelect.value));
    this.yearSelect.addEventListener("change", () => {
      this.activeYear = this.yearSelect.value;
      if (this.view === "trends") this.renderTerms();
      this.renderPapers();
    });
    this.researchTabs.addEventListener("click", event => {
      const button = event.target.closest("button[data-subprocess]");
      if (!button) return;
      if (this.compactSubprocessMenu.matches) this.subprocessMenu.open = false;
      if (button.dataset.subprocess !== this.subprocess?.slug) this.navigate(this.slug, button.dataset.subprocess);
    });
    this.loadMore.addEventListener("click", () => this.loadNext());
    this.signalTerms.addEventListener("click", event => {
      const button = event.target.closest("button[data-signal]");
      if (button) this.setSignal(button.dataset.signal);
    });
    this.retry.addEventListener("click", () => {
      if (this.retryMode === "more") this.loadNext();
      else this.loadInitial();
    });
    addEventListener("popstate", () => this.open(this.stageFromUrl(), this.viewFromUrl(), this.selectionFromUrl()));
    this.open(this.stageFromUrl(), this.viewFromUrl(), this.selectionFromUrl());
  }

  syncSubprocessMenu() {
    this.subprocessMenu.open = !this.compactSubprocessMenu.matches;
  }

  stageFromUrl() {
    const value = new URLSearchParams(location.search).get("stage");
    const slug = LEGACY_STAGE_SLUGS[value] || value;
    return slug in STAGE_BY_SLUG ? slug : "prepare";
  }

  viewFromUrl() {
    const view = new URLSearchParams(location.search).get("view");
    return view === "about" ? "about" : "trends";
  }

  selectionFromUrl() {
    return new URLSearchParams(location.search).get("subprocess") || "";
  }

  navigate(slug, selection = "") {
    const stage = STAGE_BY_SLUG[slug] || STAGE_BY_SLUG.prepare;
    const subprocess = stage.steps.find(step => step.slug === selection) || stage.steps[0];
    const params = new URLSearchParams({ stage: stage.slug, subprocess: subprocess.slug });
    updateAddress("pushState", `?${params}`);
    this.open(stage.slug, "trends", subprocess.slug);
  }

  open(slug, view = "trends", selection = "") {
    this.controller?.abort();
    this.slug = slug;
    this.stage = STAGE_BY_SLUG[slug];
    this.view = view === "about" ? "about" : "trends";
    this.subprocess = this.stage.steps.find(step => step.slug === selection) || this.stage.steps[0];
    this.stageSelect.value = slug;
    document.querySelector("#back-link").href = `./index.html#stage-${slug}`;
    document.querySelector("#stage-kicker").textContent = `${String(this.stage.index + 1).padStart(2, "0")} / ${String(STAGES.length).padStart(2, "0")} · ${this.stage.title}`;
    const isAbout = this.view === "about";
    this.stagePicker.hidden = isAbout;
    this.subprocessMenu.hidden = isAbout;
    this.sectionLink.textContent = isAbout ? "Research" : "About";
    const context = `stage=${slug}&subprocess=${this.subprocess.slug}`;
    this.sectionLink.href = isAbout ? `./research.html?${context}` : `./research.html?view=about&${context}`;
    this.brandTitle.textContent = isAbout ? "About" : "Trends & research";
    this.trendLayout.hidden = isAbout;
    this.aboutView.hidden = !isAbout;
    this.signalPanel.hidden = isAbout;
    this.methodPanel.hidden = true;
    this.methodSummary.hidden = true;
    this.paperPanel.hidden = isAbout;
    this.referenceIndexPanel.hidden = true;
    this.referencePanel.hidden = true;
    if (isAbout) this.openAbout();
    else {
      this.renderSubprocessTabs();
      this.openSubprocess();
    }
  }

  renderSubprocessTabs() {
    const selectedIndex = this.stage.steps.indexOf(this.subprocess);
    this.subprocessSummary.textContent = `${String(selectedIndex + 1).padStart(2, "0")} · ${this.subprocess.action}`;
    this.researchTabs.replaceChildren(...this.stage.steps.map((step, index) => {
      const button = this.element("button", "", `${String(index + 1).padStart(2, "0")} · ${step.action}`);
      button.type = "button";
      button.dataset.subprocess = step.slug;
      if (step === this.subprocess) button.setAttribute("aria-current", "page");
      return button;
    }));
    this.syncSubprocessMenu();
  }

  openAbout() {
    document.title = "About — DNA Storage";
    document.querySelector("#back-link").href = "./index.html";
    document.querySelector("#stage-kicker").textContent = "ABOUT";
    document.querySelector("#research-prompt").textContent = "How the";
    document.querySelector("#stage-title").textContent = "research pages are built";
    document.querySelector("#research-punctuation").textContent = "";
    document.querySelector("#stage-scope").hidden = true;
    this.aboutTermIndex.replaceChildren(...STAGES.map((stage, index) => {
      const row = this.element("article", "about-term-row");
      const heading = this.element("div", "about-term-heading");
      heading.append(this.element("b", "", String(index + 1).padStart(2, "0")), this.element("strong", "", stage.title));
      const details = this.element("div", "about-term-copy");
      const sources = this.element("p", "about-term-sources");
      sources.append("Source basis: ");
      STAGE_SOURCE_IDS[stage.slug].forEach((sourceId, sourceIndex) => {
        if (sourceIndex) sources.append(" · ");
        const source = SOURCES[sourceId];
        const link = this.element("a", "", source.label);
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        sources.append(link);
      });
      details.append(
        ...stage.steps.map(step => this.element("code", "", `${step.action}: ${step.signals.join(" · ")}`)),
        sources
      );
      row.append(heading, details);
      return row;
    }));
  }

  openSubprocess() {
    const subprocess = this.subprocess;
    const params = new URLSearchParams({ stage: this.slug, subprocess: subprocess.slug });
    if (location.search !== `?${params}`) updateAddress("replaceState", `?${params}`);
    document.title = `${subprocess.action} — ${this.stage.title}`;
    document.querySelector("#research-prompt").textContent = "Research on";
    document.querySelector("#stage-title").textContent = subprocess.action.replace("*", "");
    document.querySelector("#research-punctuation").textContent = "";
    document.querySelector("#stage-scope").hidden = false;
    document.querySelector("#stage-scope").textContent = subprocess.purpose;
    document.querySelector("#papers-eyebrow").textContent = "Newest first";
    document.querySelector("#papers-title").textContent = subprocess.action;
    this.query = `${DNA_STORAGE_QUERY} AND (${subprocess.terms})`;
    this.prepareFeed();
    this.resetSignal();
    this.loadInitial();
  }

  openMethodologies(methodSlug) {
    document.title = `${this.stage.title} methodologies — DNA Storage`;
    document.querySelector("#research-prompt").textContent = "Methods for";
    document.querySelector("#research-punctuation").textContent = "";
    document.querySelector("#stage-scope").hidden = false;
    document.querySelector("#stage-scope").textContent = "Choose a method family to compare its mechanism, use case, trade-off, and recent evidence.";
    const method = this.stage.methods.find(item => item.slug === methodSlug) || this.stage.methods[0];
    this.canonicalSelection("method", method.slug);
    this.methodList.replaceChildren(...this.stage.methods.map(item => {
      const button = this.element("button", "method-option");
      button.type = "button";
      button.dataset.method = item.slug;
      button.setAttribute("aria-pressed", String(item === method));
      button.append(this.element("strong", "", item.name), this.element("small", "", item.summary));
      return button;
    }));
    this.method = method;
    document.querySelector("#method-title").textContent = method.name;
    document.querySelector("#method-description").textContent = method.summary;
    document.querySelector("#method-use").textContent = method.use;
    document.querySelector("#method-tradeoff").textContent = method.tradeoff;
    this.methodSources.replaceChildren(...METHOD_SOURCE_IDS[this.slug][method.slug].map(sourceId => {
      const source = SOURCES[sourceId];
      const link = this.element("a", "", `${source.label} ↗`);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      return link;
    }));
    document.querySelector("#papers-eyebrow").textContent = "Newest evidence";
    document.querySelector("#papers-title").textContent = method.name;
    this.query = `${DNA_STORAGE_QUERY} AND (${this.stage.terms}) AND (${method.terms})`;
    this.prepareFeed();
    this.loadInitial();
  }

  openStateOfArt(entrySlug) {
    document.title = `${this.stage.title} state of the art — DNA Storage`;
    document.querySelector("#research-prompt").textContent = "Reference work for";
    document.querySelector("#research-punctuation").textContent = "";
    document.querySelector("#stage-scope").hidden = false;
    document.querySelector("#stage-scope").textContent = "Representative results, with the demonstrated boundary shown beside each claim.";
    this.renderReferenceView(this.stage.frontier, entrySlug, {
      indexEyebrow: "State of the art",
      indexTitle: "Reference results",
      indexCopy: "Select a result to see what was demonstrated.",
      caveat: `Manually selected, not ranked. Checked ${REVIEWED_ON}.`,
      eyebrow: "Selected result",
      meta: item => `${item.year} · ${item.status}`,
      labels: ["Demonstrated", "Why it matters", "Boundary"],
      values: item => [item.result, item.significance, item.boundary]
    });
  }

  openStandards(entrySlug) {
    document.title = `${this.stage.title} standards — DNA Storage`;
    document.querySelector("#research-prompt").textContent = "Standards for";
    document.querySelector("#research-punctuation").textContent = "";
    document.querySelector("#stage-scope").hidden = false;
    document.querySelector("#stage-scope").textContent = "Document status and stage relevance are stated exactly; white papers are excluded.";
    const mapped = STANDARD_STAGE_MAP[this.slug].map(item => ({
      ...STANDARD_RECORDS[item.id], relevance: item.relevance
    }));
    const entries = mapped.length ? mapped : [STANDARD_GAPS[this.slug]];
    this.renderReferenceView(entries, entrySlug, {
      indexEyebrow: "Standards",
      indexTitle: mapped.length ? "Applicable documents" : "Current coverage",
      indexCopy: mapped.length ? "Direct and adjacent standards are labelled separately." : "No direct stage-specific document was found.",
      caveat: `Official issuer records only. Checked ${REVIEWED_ON}.`,
      eyebrow: "Selected document",
      meta: item => `${item.issuer} · ${item.date}`,
      labels: ["Relevance here", "Covers", "Does not cover"],
      values: item => [item.relevance, item.scope, item.excludes]
    });
  }

  renderReferenceView(items, entrySlug, copy) {
    const selected = items.find(item => item.slug === entrySlug) || items[0];
    this.canonicalSelection("entry", selected.slug);
    document.querySelector("#reference-index-eyebrow").textContent = copy.indexEyebrow;
    document.querySelector("#reference-index-title").textContent = copy.indexTitle;
    document.querySelector("#reference-index-copy").textContent = copy.indexCopy;
    document.querySelector("#reference-index-caveat").textContent = copy.caveat;
    this.referenceList.replaceChildren(...items.map(item => {
      const button = this.element("button", "reference-option");
      button.type = "button";
      button.dataset.entry = item.slug;
      button.setAttribute("aria-pressed", String(item === selected));
      const detail = this.view === "standards" ? `${item.issuer} · ${item.status}` : `${item.year} · ${item.status}`;
      button.append(this.element("strong", "", item.name), this.element("small", "", detail));
      return button;
    }));

    document.querySelector("#reference-eyebrow").textContent = copy.eyebrow;
    document.querySelector("#reference-title").textContent = selected.name;
    const status = document.querySelector("#reference-status");
    status.textContent = selected.status;
    status.dataset.tone = selected.status === "Coverage gap" ? "gap" : "document";
    document.querySelector("#reference-meta").textContent = copy.meta(selected);
    const labels = ["one", "two", "three"];
    const values = copy.values(selected);
    labels.forEach((key, index) => {
      document.querySelector(`#reference-label-${key}`).textContent = copy.labels[index];
      document.querySelector(`#reference-value-${key}`).textContent = values[index];
    });
    this.referenceSources.replaceChildren(...selected.sourceIds.map(sourceId => {
      const source = SOURCES[sourceId];
      const link = this.element("a", "", `${source.label} ↗`);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      return link;
    }));
    document.querySelector("#reference-checked").textContent = `Record checked ${REVIEWED_ON}.`;
  }

  canonicalSelection(key, value) {
    const params = new URLSearchParams(location.search);
    if (params.get(key) === value) return;
    params.set("stage", this.slug);
    params.set("view", this.view);
    params.delete(key === "method" ? "entry" : "method");
    params.set(key, value);
    updateAddress("replaceState", `?${params}`);
  }

  prepareFeed() {
    this.source = new PubMedSource(this.query);
    this.results = [];
    this.activeSignal = "";
    this.activeYear = "";
    this.total = 0;
    this.rawLoaded = 0;
    this.hasMore = false;
    this.renderYears();
    document.querySelector("#query-text").textContent = this.query;
    document.querySelector("#source-link").href = this.source.sourceUrl();
  }

  resetSignal() {
    document.querySelector("#signal-title").textContent = "Checking the literature…";
    document.querySelector("#signal-period").textContent = "Latest three complete years vs the preceding three.";
    document.querySelector("#recent-count").textContent = "—";
    document.querySelector("#previous-count").textContent = "—";
    document.querySelector("#recent-period").textContent = "Recent";
    document.querySelector("#previous-period").textContent = "Previous";
    this.signalTerms.replaceChildren(this.element("span", "", "Waiting for results"));
  }

  async loadInitial() {
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.source = new PubMedSource(this.query);
    this.results = [];
    this.renderLoading();

    try {
      const page = await this.source.next(signal);
      if (!signal.aborted) this.renderPage(page, false);
    } catch (error) {
      if (error.name !== "AbortError") this.renderError(false);
    }
    if (this.view !== "trends" || signal.aborted) return;
    try {
      const activity = await this.source.activity(signal);
      if (!signal.aborted) this.renderActivity(activity);
    } catch (error) {
      if (error.name !== "AbortError") this.renderActivityError();
    }
  }

  async loadNext() {
    if (this.loadMore.disabled) return;
    this.loadMore.disabled = true;
    this.loadMore.textContent = "Loading…";
    this.retry.hidden = true;
    this.list.setAttribute("aria-busy", "true");
    try {
      const page = await this.source.next(this.controller.signal);
      this.renderPage(page, true);
    } catch (error) {
      if (error.name !== "AbortError") this.renderError(true);
    }
  }

  renderLoading() {
    this.status.classList.remove("is-error");
    this.status.textContent = "Loading 10 publications…";
    this.list.setAttribute("aria-busy", "true");
    this.list.replaceChildren(...Array.from({ length: 5 }, () => this.element("li", "paper-skeleton")));
    this.yearSelect.disabled = true;
    this.loadMore.hidden = true;
    this.retry.hidden = true;
  }

  renderPage(page, append) {
    const returnFocus = append && document.activeElement === this.loadMore;
    const records = append ? [...this.results, ...page.results] : page.results;
    this.results = this.deduplicate(records);
    this.total = page.total;
    this.rawLoaded = page.loaded;
    this.hasMore = page.hasMore;
    this.list.setAttribute("aria-busy", "false");
    this.status.classList.remove("is-error");
    this.renderYears();
    if (this.view === "trends") this.renderTerms();
    this.renderPapers();
    this.loadMore.hidden = !page.hasMore;
    this.loadMore.disabled = false;
    this.loadMore.textContent = "Load 10 more";
    this.retry.hidden = true;
    if (!page.hasMore && this.results.length && returnFocus) this.status.focus();
  }

  renderError(isMore) {
    this.retryMode = isMore ? "more" : "initial";
    this.status.classList.add("is-error");
    this.status.textContent = isMore
      ? "Couldn’t load the next results. The publications above are unchanged."
      : "Couldn’t reach PubMed. Check the connection or open the source search.";
    this.list.setAttribute("aria-busy", "false");
    if (!isMore) this.list.replaceChildren();
    this.yearSelect.disabled = !this.results.length;
    this.loadMore.hidden = true;
    this.loadMore.disabled = false;
    this.loadMore.textContent = "Load 10 more";
    this.retry.hidden = false;
    if (isMore) this.retry.focus();
  }

  renderActivity({ recent, previous, recentCount, previousCount }) {
    document.querySelector("#recent-period").textContent = `${recent[0]}–${recent[1]}`;
    document.querySelector("#previous-period").textContent = `${previous[0]}–${previous[1]}`;
    document.querySelector("#recent-count").textContent = recentCount.toLocaleString();
    document.querySelector("#previous-count").textContent = previousCount.toLocaleString();
    const title = document.querySelector("#signal-title");
    const period = document.querySelector("#signal-period");

    if (!previousCount && recentCount) {
      title.textContent = "New activity";
      period.textContent = "No matching publications in the previous period; percentage change is undefined.";
      return;
    }

    if (recentCount + previousCount < 10) {
      title.textContent = "Limited volume";
      period.textContent = "Counts shown; too few papers for a stable comparison.";
      return;
    }

    const change = Math.round(((recentCount - previousCount) / previousCount) * 100);
    title.textContent = change === 0 ? "No change" : `${change > 0 ? "+" : ""}${change}%`;
    period.textContent = "Change in matching publications between the two periods.";
  }

  renderActivityError() {
    document.querySelector("#signal-title").textContent = "Activity unavailable";
    document.querySelector("#signal-period").textContent = "The publication feed may still be available.";
  }

  renderTerms() {
    const records = this.activeYear
      ? this.results.filter(record => this.publicationYear(record) === this.activeYear)
      : this.results;
    const terms = this.subprocess.signals.map(term => ({
      term,
      count: records.filter(record => this.matchesSignal(record, term)).length
    })).filter(item => item.count || item.term === this.activeSignal).sort((a, b) => b.count - a.count);

    const otherCount = records.filter(record => this.matchesSignal(record, OTHER_SIGNAL)).length;

    if (!this.results.length) {
      this.activeSignal = "";
      this.signalTerms.replaceChildren(this.element("span", "", "No tracked terms yet"));
      return;
    }

    const categories = [{ term: "", count: records.length }, ...terms, { term: OTHER_SIGNAL, count: otherCount }];
    const nodes = categories.map(item => {
      const label = item.term === OTHER_SIGNAL ? "Other" : item.term || "All loaded";
      const button = this.element("button", "signal-term", `${label} · ${item.count}`);
      button.type = "button";
      button.dataset.signal = item.term;
      button.setAttribute("aria-controls", "paper-list");
      button.setAttribute("aria-label", item.term === OTHER_SIGNAL
        ? "Filter loaded papers with no tracked signal"
        : item.term ? `Filter loaded papers by ${item.term}` : "Show all loaded papers");
      button.setAttribute("aria-pressed", String(item.term === this.activeSignal));
      return button;
    });
    this.signalTerms.replaceChildren(...nodes);
  }

  setSignal(term) {
    this.activeSignal = term === this.activeSignal ? "" : term;
    this.renderTerms();
    this.renderPapers();
    [...this.signalTerms.querySelectorAll("button")]
      .find(button => button.dataset.signal === this.activeSignal)?.focus();
  }

  renderYears() {
    const counts = this.results.reduce((years, record) => {
      const year = this.publicationYear(record);
      if (year) years.set(year, (years.get(year) || 0) + 1);
      return years;
    }, new Map());
    const years = [...counts.keys()].sort((a, b) => Number(b) - Number(a));
    if (this.activeYear && !counts.has(this.activeYear)) this.activeYear = "";
    const options = [this.element("option", "", "All years"), ...years.map(year => {
      const option = this.element("option", "", `${year} · ${counts.get(year)}`);
      option.value = year;
      return option;
    })];
    options[0].value = "";
    this.yearSelect.replaceChildren(...options);
    this.yearSelect.value = this.activeYear;
    this.yearSelect.disabled = !years.length;
  }

  matchesSignal(record, term) {
    const text = `${record.title || ""} ${record.abstractText || ""}`.toLowerCase();
    if (term === OTHER_SIGNAL) {
      return !this.subprocess.signals.some(signal => text.includes(signal.toLowerCase()));
    }
    return text.includes(term.toLowerCase());
  }

  renderPapers() {
    const visible = this.results.filter(record =>
      (!this.activeSignal || this.matchesSignal(record, this.activeSignal)) &&
      (!this.activeYear || this.publicationYear(record) === this.activeYear)
    );

    if (!this.results.length) {
      this.list.replaceChildren(this.element("li", "paper-card empty-result", "No matching publications."));
      this.status.textContent = "PubMed returned no matches for this definition.";
      return;
    }

    if (!visible.length) {
      this.list.replaceChildren(this.element("li", "paper-card empty-result", "No loaded publications match these filters."));
      this.status.textContent = `0 of ${this.results.length} unique loaded publications match the selected filters.`;
      return;
    }

    this.list.replaceChildren(...visible.map(record => this.paper(record)));
    const filters = [];
    if (this.activeSignal === OTHER_SIGNAL) filters.push("no tracked signal");
    else if (this.activeSignal) filters.push(`“${this.activeSignal}”`);
    if (this.activeYear) filters.push(this.activeYear);
    if (filters.length) {
      this.status.textContent = `${visible.length} of ${this.results.length} unique loaded publications match ${filters.join(" and ")}.`;
    } else {
      this.status.textContent = `${this.results.length} unique of ${this.total.toLocaleString()} matching records loaded.`;
    }
    const duplicateCount = Math.max(0, this.rawLoaded - this.results.length);
    if (duplicateCount) this.status.textContent += ` ${duplicateCount} duplicate ${duplicateCount === 1 ? "record" : "records"} removed.`;
    if (!this.hasMore) this.status.textContent += " All available results are loaded.";
  }

  paper(record) {
    const item = this.element("li", "paper-card");
    const meta = this.element("p", "paper-meta");
    const year = this.publicationYear(record) || "Undated";
    const journal = record.journalTitle || record.journalInfo?.journal?.title || "Source not listed";
    meta.append(this.element("span", "", year), this.element("span", "", journal));
    const publicationType = Array.isArray(record.pubTypeList?.pubType) ? record.pubTypeList.pubType[0] : record.pubType;
    if (publicationType) meta.append(this.element("span", "", publicationType));
    if (Number(record.citedByCount)) meta.append(this.element("span", "", `${record.citedByCount} citations`));
    if (record.isOpenAccess === "Y") meta.append(this.element("span", "open-access", "Open access"));
    const doiUrl = this.doiUrl(record.doi);
    if (doiUrl) {
      const doi = this.element("a", "", "DOI ↗");
      doi.href = doiUrl;
      doi.target = "_blank";
      doi.rel = "noreferrer";
      meta.append(doi);
    }

    const title = this.element("h3");
    const link = this.element("a", "", this.clean(record.title) || "Untitled record");
    link.href = this.recordUrl(record);
    link.target = "_blank";
    link.rel = "noreferrer";
    title.append(link);

    const authors = this.element("p", "paper-authors", this.truncate(record.authorString || "Authors not listed", 150));
    const abstract = this.clean(record.abstractText);
    item.append(meta, title, authors);
    if (abstract) item.append(this.element("p", "paper-abstract", this.truncate(abstract, 320)));
    return item;
  }

  recordUrl(record) {
    return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(record.pmid || record.id || "")}/`;
  }

  publicationYear(record) {
    return String(record.firstPublicationDate || record.pubYear || "").match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
  }

  deduplicate(records) {
    const unique = [];
    const owners = new Map();
    records.forEach(record => {
      const keys = this.recordKeys(record);
      const existing = keys.map(key => owners.get(key)).find(index => index !== undefined);
      const index = existing ?? unique.length;
      if (existing === undefined) unique.push(record);
      else if (this.recordScore(record) > this.recordScore(unique[index])) unique[index] = record;
      keys.forEach(key => owners.set(key, index));
      this.recordKeys(unique[index]).forEach(key => owners.set(key, index));
    });
    return unique;
  }

  recordKeys(record) {
    const doi = this.normalizeDoi(record.doi);
    const sourceId = [record.source, record.id].filter(Boolean).join(":").toLowerCase();
    const title = this.clean(record.title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const durable = [
      doi && `doi:${doi}`,
      record.pmid && `pmid:${String(record.pmid).toLowerCase()}`,
      record.pmcid && `pmcid:${String(record.pmcid).toLowerCase()}`
    ].filter(Boolean);
    const fallback = !durable.length && title
      ? [`title:${title}:${this.publicationYear(record) || "undated"}`]
      : [];
    return [...durable, sourceId && `source:${sourceId}`, ...fallback].filter(Boolean);
  }

  recordScore(record) {
    return [record.doi, record.abstractText, record.authorString, record.journalTitle, record.pmcid]
      .reduce((score, value) => score + String(value || "").length, 0);
  }

  doiUrl(value) {
    const doi = this.normalizeDoi(value);
    return doi ? `https://doi.org/${doi.split("/").map(encodeURIComponent).join("/")}` : "";
  }

  normalizeDoi(value) {
    return String(value || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^\/+/, "").toLowerCase();
  }

  clean(value = "") {
    return new DOMParser().parseFromString(String(value), "text/html").body.textContent.trim();
  }

  truncate(value, length) {
    return value.length > length ? `${value.slice(0, length).trim()}…` : value;
  }

  element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
}

if (document.querySelector("#process-grid")) new ProcessView().mount();
if (document.querySelector("#research-page")) new ResearchPage().mount();
