"""
NeuroCut region definitions: mapping Destrieux atlas parcels to functional brain regions.

Each key is a NeuroCut target region; values are lists of Destrieux atlas label names
(applied to BOTH hemispheres). Labels must match exactly what nilearn's
fetch_atlas_surf_destrieux() returns in atlas["labels"].

Some parcels appear in multiple regions (e.g., Pole_temporal in both
emotional_processing and social_cognition). This is neuroanatomically valid --
brain regions serve multiple functions. Per-region scores remain independent.
"""

REGION_DEFINITIONS: dict = {
    "attention": [
        # Dorsal attention network (Corbetta & Shulman 2002)
        "S_intrapariet_and_P_trans",  # Intraparietal sulcus (IPS)
        "G_front_middle",              # Frontal eye fields (FEF) -- middle frontal gyrus
        "G_parietal_sup",              # Superior parietal lobule (SPL)
        "S_front_middle",              # Middle frontal sulcus
        "S_front_sup",                 # Superior frontal sulcus
        # Ventral attention network
        "G_pariet_inf-Supramar",       # Supramarginal gyrus (TPJ component)
        "G_front_inf-Opercular",       # Ventral frontal cortex
    ],
    "reward": [
        # Reward/valuation network (Bartra et al. 2013)
        # Note: Ventral striatum is subcortical -- NOT on cortical surface
        "G_rectus",                     # Gyrus rectus (vmPFC component)
        "G_subcallosal",                # Subcallosal area (vmPFC component)
        "G_and_S_cingul-Ant",           # Anterior cingulate (ACC)
        "G_and_S_cingul-Mid-Ant",       # Mid-anterior cingulate
        "G_orbital",                    # Orbital gyri (OFC)
        "S_orbital-H_Shaped",           # H-shaped orbital sulcus
        "S_orbital_lateral",            # Lateral orbital sulcus
        "S_orbital_med-olfact",         # Medial orbital/olfactory sulcus
        "G_front_inf-Orbital",          # Orbital part of IFG
    ],
    "emotional_processing": [
        # Emotion network (Lindquist et al. 2012)
        # Note: Amygdala is subcortical -- NOT on cortical surface
        "G_insular_short",              # Short insular gyri (anterior insula)
        "G_Ins_lg_and_S_cent_ins",      # Long insular gyrus
        "S_circular_insula_ant",        # Anterior circular sulcus of insula
        "S_circular_insula_sup",        # Superior circular sulcus of insula
        "S_circular_insula_inf",        # Inferior circular sulcus of insula
        "G_and_S_cingul-Mid-Post",      # Mid-posterior cingulate
        "G_cingul-Post-dorsal",         # Posterior dorsal cingulate
        "G_temp_sup-Plan_polar",        # Planum polare (anterior STG)
        "Pole_temporal",                # Temporal pole
    ],
    "social_cognition": [
        # Social brain network (Frith & Frith 2007; Saxe 2006)
        "S_temporal_sup",               # Superior temporal sulcus (STS)
        "G_temp_sup-Lateral",           # Lateral superior temporal gyrus
        "G_temp_sup-Plan_tempo",        # Planum temporale
        "G_pariet_inf-Angular",         # Angular gyrus (TPJ component)
        "G_precuneus",                  # Precuneus
        "G_front_sup",                  # Superior frontal gyrus (mPFC component)
        "G_cingul-Post-ventral",        # Posterior ventral cingulate / isthmus
        "Pole_temporal",                # Temporal pole (shared with emotional_processing)
    ],
}
