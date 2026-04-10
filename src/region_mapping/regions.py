"""
NeuroCut region definitions: mapping Destrieux atlas parcels to 9 functional brain networks.

Each key is a NeuroCut target region; values are lists of Destrieux atlas label names
(applied to BOTH hemispheres). Labels must match exactly what nilearn's
fetch_atlas_surf_destrieux() returns in atlas["labels"].

Some parcels appear in multiple regions (e.g., Pole_temporal in both
emotional_processing and social_cognition). This is neuroanatomically valid --
brain regions serve multiple functions. Per-region scores remain independent.

Networks:
  1. attention          — Dorsal & ventral attention
  2. reward             — Reward/valuation
  3. emotional_processing — Emotion/interoception
  4. social_cognition   — Social brain / theory of mind
  5. visual_processing  — Primary & associative visual cortex
  6. auditory_processing — Auditory cortex
  7. language_narrative  — Language network
  8. default_mode       — Default mode network
  9. motion_processing  — Motion-sensitive cortex
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
    "visual_processing": [
        # Primary and associative visual cortex (Grill-Spector & Malach 2004)
        "S_calcarine",                  # Calcarine sulcus (V1)
        "G_cuneus",                     # Cuneus (V2/V3)
        "S_oc_sup_and_transversal",     # Superior occipital sulcus
        "G_occipital_sup",              # Superior occipital gyrus
        "G_oc-temp_lat-fusifor",        # Fusiform gyrus (face/object area)
        "S_oc-temp_lat",                # Lateral occipitotemporal sulcus
        "G_occipital_middle",           # Middle occipital gyrus (V5/MT+)
        "Pole_occipital",               # Occipital pole
    ],
    "auditory_processing": [
        # Auditory cortex (Hickok & Poeppel 2007)
        "G_temp_sup-G_T_transv",        # Heschl's gyrus (primary auditory cortex A1)
        "G_temp_sup-Plan_tempo",        # Planum temporale (shared with social_cognition)
        "S_temporal_transverse",         # Transverse temporal sulcus
        "G_temp_sup-Lateral",           # Lateral STG (shared with social_cognition)
        "S_temporal_sup",               # Superior temporal sulcus (shared with social_cognition)
        "G_temp_sup-Plan_polar",        # Planum polare (shared with emotional_processing)
    ],
    "language_narrative": [
        # Language network (Fedorenko et al. 2011; Hagoort 2013)
        "G_front_inf-Triangul",          # Pars triangularis of IFG (Broca's area)
        "G_front_inf-Opercular",         # Pars opercularis of IFG (shared with attention)
        "S_front_inf",                   # Inferior frontal sulcus
        "G_temp_sup-Lateral",           # Lateral STG (Wernicke's area, shared)
        "G_temp_sup-Plan_tempo",        # Planum temporale (shared)
        "G_pariet_inf-Angular",          # Angular gyrus (shared with social_cognition)
        "G_temporal_middle",             # Middle temporal gyrus
        "S_temporal_inf",                # Inferior temporal sulcus
    ],
    "default_mode": [
        # Default mode network (Raichle et al. 2001; Buckner et al. 2008)
        "G_precuneus",                   # Precuneus (shared with social_cognition)
        "G_cingul-Post-dorsal",          # Posterior cingulate (shared with emotional_processing)
        "G_cingul-Post-ventral",         # Ventral PCC / isthmus (shared with social_cognition)
        "G_front_sup",                   # Medial prefrontal cortex (shared with social_cognition)
        "G_front_middle",                # Middle frontal gyrus (shared with attention)
        "G_pariet_inf-Angular",          # Angular gyrus (shared with social_cognition)
        "Pole_temporal",                 # Temporal pole (shared)
        "G_temporal_middle",             # Middle temporal gyrus (shared with language)
    ],
    "motion_processing": [
        # Motion-sensitive cortex (Tootell et al. 1995; Orban et al. 2004)
        "G_occipital_middle",            # V5/MT+ complex (shared with visual)
        "S_oc_middle_and_Lunatus",       # Middle occipital sulcus / lunate
        "G_oc-temp_med-Parahip",         # Parahippocampal area (spatial navigation)
        "S_parieto_occipital",           # Parieto-occipital sulcus
        "G_parietal_sup",                # Superior parietal (spatial, shared with attention)
        "S_intrapariet_and_P_trans",     # Intraparietal sulcus (shared with attention)
    ],
}
