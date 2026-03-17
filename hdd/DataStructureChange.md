Here I will work on a future structure change. We already have a decent database but we also have a lot info that we didnt know how it would fit into filters etc so we wrote everything i noted down while reading the papers in "notes" so we dont lose info.

we also have random tags/keys i created that hold information that originally wouldnt fit anywhere. The plan is to now make a sort of definitive list of tags by setting the contribution form. This will lead to new submissions having different tags then the old data entries.**

**To fix this data structure difference, i will have to go back to the original datasets (not the databank but the individual files) and enforce the new structure. Dont omit missing but instead have as "not_reported". 
1. Phase 1: We will go through the entries, enforce tags we WANT, remove tags we dont and dump the info into notes. 
2. Phase Two: Then we will go thru notes and see if the information there is already present in the tags we have after phase 1. if yes, remove THAT piece of informatin from notes. if not, which tag/key should hold this info? -> Add it there.
3. Phase three: are there still notes left? if yes, what and why? Decide if we want new tags | leave in notes | or drop information all together
4. Phase four: Is there any information from the original papers missing in this new structure? Go back to original notes from reading papers and see if you have that piece of info, if yes add, if no... well sh... mark this in some way so maybe someone can go back and read again? 

**-------- Space for random thoughts of what to include --------**
I think for the material wehave everything we want. We have big buckets for the material class, smaller to grade, microstructure and then phase and even processing. 

For publication level we need to add the "Data origin" tag 
Dropdown: Data source
- Direct measurement
- Extracted from graph
- Calculated / Simulation
- Literature review


**--------------------------------------------------------------**

Based on what I’ve seen in the dataset, likely gaps are:

Material state: cold work %, heat treatment details (temp/time/sequence), residual stress/applied stress.
Microstructure specifics: phase fractions, grain size, inclusion content, trap density, dislocation density.
Surface specifics: roughness (Ra), specific prep steps (e.g., grit size if not in list), oxide type.
Experimental context: sample orientation, thickness used in model (if not same as physical thickness), reference method used to derive D.

**---**

deformation_history:
  type: select
  options:
    - none
    - cold_worked
    - pre_strained
    - plastically_deformed
    - fatigue_preloaded
    - other

pre_strain_percent:
  type: number
  required: false
  visible_if:
    deformation_history in [pre_strained, plastically_deformed]

cold_reduction_percent:
  type: number
  required: false
  visible_if:
    deformation_history == cold_worked

and also

mechanical_loading_during_test:
  type: select
  required: false
  options:
    - none
    - constant_tension
    - constant_compression
    - constant_strain
    - cyclic_loading
    - fatigue_loading
    - slow_strain_rate
    - residual_stress_only
    - other

dependables:

loading_regime:
  type: select
  required: false
  options:
    - elastic
    - elastic_plastic
    - plastic
    - other

applied_stress_mpa:
  type: number
  required: false

applied_strain_percent:
  type: number
  required: false
-----------------------


    data_rows:
      description: >
        One row per model, condition, or single-point value. Row-level overrides should
        be available when one series differs from study defaults.

      required_fields:
        - group_name
        - series_name
        - model_type
        - tmin_c
        - tmax_c

      optional_fields:
        - diffusion_coefficient_value
        - activation_energy
        - pre_exponential_factor
        - power_law_parameters
        - notes

      override_defaults_per_row: true
      row_override_fields:
        - material_class
        - material_grade
        - microstructure_region
        - phase
        - processing_state
        - thickness_mm
        - geometry
        - test_temperature_c
        - surface_condition
        - coated
        - coating_type
        - coating_thickness_um
        - measurement_method
        - charging_method
        - diffusion_coefficient_determination
        - trapping_considered

