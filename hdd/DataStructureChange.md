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

  fields:

    publication:
      data_origin:
        type: select
        label: Data origin
        default: direct_measurement
        options:
          - direct_measurement
          - extracted_from_publication_graph
          - literature_compilation
          - simulation_only
          - review_or_meta_analysis
          - unknown
        help: >
          Describes where the diffusion value actually comes from.

      title:
        type: text
        required: true

      authors:
        type: repeatable_group
        fields:
          - first_name
          - last_name
          - orcid

      journal_or_venue:
        type: text
        required: true

      year:
        type: integer
        required: true

      doi:
        type: text
        required: true

      open_access_url:
        type: url
        required: true

      language:
        type: select
        required: true

      abstract:
        type: textarea
        required: false

      research_focus_tags:
        type: multiselect
        required: false
        options:
          - alloying_elements
          - coatings
          - cold_work_and_applied_stresses
          - grain_boundaries_and_particle_matrix_interfaces
          - haz_specific_effects
          - inner_effects_trapping
          - lattice_imperfections
          - liquidus
          - microstructure_influence
          - microvoids_and_nonmetallic_inclusions
          - oxide_and_other_passivators
          - porosity
          - surface_effects
          - surface_mass_transfer
          - surface_state_and_reactions
          - weld_metal_specific_effects
          - propose_new

      additional_notes:
        type: textarea
        required: false

    study_defaults:
      material_class:
        type: select
        required: true

      material_grade:
        type: select_or_text
        required: true

      microstructure_region:
        type: select
        required: true
        options:
          - base_material
          - haz
          - cghaz
          - fghaz
          - ichaz
          - weld_metal
          - other

      phase:
        type: select
        required: false
        options:
          - ferritic
          - martensitic
          - bainitic
          - pearlitic
          - austenitic
          - multiphase
          - other

      processing_state:
        type: select
        required: false
        options:
          - as_received
          - as_welded
          - annealed
          - normalized
          - quenched
          - q_and_t
          - pwht
          - stress_relief
          - cold_worked
          - tmcp
          - surface_treated
          - aged
          - subzero_treated
          - other

      thickness_mm:
        type: number
        required: false

      geometry:
        type: select
        required: false
        options:
          - membrane
          - plate
          - sheet
          - wire
          - rod
          - cylinder
          - other

      test_temperature_c:
        type: number
        required: false

      composition_wt_percent:
        type: repeatable_group
        fields:
          - element
          - value

      material_notes:
        type: textarea
        required: false

    measurement_context:
      measurement_method:
        type: select
        required: true
        options:
          - deflection_method
          - electrical_resistance
          - electrochemical_permeation
          - gas_permeation
          - hot_extraction_cghe_gc
          - isothermal_effusion_degassing
          - literature_compilation
          - sims
          - thermal_desorption_tda_tds
          - other

      diffusion_coefficient_determination:
        type: select
        required: false
        options:
          - time_lag_method
          - breakthrough_time
          - curve_fitting_ficks_law
          - numerical_fit
          - reported_in_paper_not_specified
          - other

      trapping_considered:
        type: select
        required: false
        options:
          - no_lattice_diffusion_only
          - effective_diffusion_with_traps
          - multi_trap_model
          - unknown

      measurement_notes:
        type: textarea
        required: false

      conditional_fields:
        electrochemical_permeation:
          detection_side_potential_v:
            type: number
            required: false
          entry_side_area_cm2:
            type: number
            required: false
          exit_side_area_cm2:
            type: number
            required: false
          membrane_thickness_mm:
            type: number
            required: false
          steady_state_confirmed:
            type: select
            options: [yes, no, unclear]

        thermal_desorption_tda_tds:
          heating_rate_k_per_min:
            type: number
            required: false
          peak_analysis_method:
            type: select
            options:
              - kissinger
              - peak_fitting
              - direct_peak_assignment
              - not_reported
              - other

        gas_permeation:
          gas_detection_mode:
            type: select
            required: false
            options:
              - pressure_decay
              - gas_chromatography
              - mass_spectrometry
              - other

        sims:
          sims_type:
            type: select
            required: false
            options:
              - tof_sims
              - dynamic_sims
              - other

        hot_extraction_cghe_gc:
          extraction_temperature_c:
            type: number
            required: false

        isothermal_effusion_degassing:
          degassing_temperature_c:
            type: number
            required: false

    charging_context:
      charging_method:
        type: select
        required: true
        options:
          - cathodic
          - electrochemical
          - electrochemical_devanathan_stachursky_cell
          - galvanostatic
          - gas_phase
          - high_pressure_hydrogen
          - immersion_in_distilled_water
          - low_pressure_hydrogen
          - other

      charging_duration_h:
        type: number
        required: false

      charging_temperature_c:
        type: number
        required: false

      conditional_fields:
        cathodic:
          electrolyte:
            type: select_or_text
            options:
              - naoh
              - h2so4
              - nacl
              - borate
              - other
          current_density_mA_per_cm2:
            type: number
          poison_additive:
            type: select_or_text
            options:
              - none
              - thiourea
              - as2o3
              - other

        electrochemical:
          electrolyte:
            type: select_or_text
          control_mode:
            type: select
            options:
              - galvanostatic
              - potentiostatic
              - not_reported
          current_density_mA_per_cm2:
            type: number
            required: false
          applied_potential_v:
            type: number
            required: false
          poison_additive:
            type: select_or_text
            required: false

        electrochemical_devanathan_stachursky_cell:
          electrolyte_entry_side:
            type: text
          electrolyte_exit_side:
            type: text
          current_density_mA_per_cm2:
            type: number
            required: false
          entry_side_potential_v:
            type: number
            required: false
          exit_side_potential_v:
            type: number
            required: false
          poison_additive:
            type: select_or_text
            required: false

        gas_phase:
          gas_composition:
            type: text
            required: false
          pressure_bar:
            type: number
            required: false
          gas_purity:
            type: text
            required: false

        high_pressure_hydrogen:
          pressure_bar:
            type: number
            required: true
          gas_composition:
            type: text
            required: false

        low_pressure_hydrogen:
          pressure_bar:
            type: number
            required: false
          gas_composition:
            type: text
            required: false

        immersion_in_distilled_water:
          solution_notes:
            type: textarea
            required: false

    surface_condition:
      include_section: true
      reason: >
        Surface state can strongly affect charging, entry, passivation, and permeability.
        This should be filterable and not hidden only in notes.

      fields:
        surface_condition:
          type: select
          required: false
          options:
            - as_received
            - ground
            - polished
            - electropolished
            - pickled
            - oxidized
            - coated
            - plated
            - passivated
            - etched
            - surface_treated
            - unknown
            - other

        surface_finish_detail:
          type: select_or_text
          required: false
          options:
            - grit_240
            - grit_600
            - grit_1200
            - mirror_polished
            - ra_reported_elsewhere
            - other

        coated:
          type: boolean
          default: false

        coating_type:
          type: select_or_text
          visible_if:
            coated: true
          options:
            - zinc
            - nickel
            - chromium
            - copper
            - aluminum
            - oxide
            - phosphate
            - paint_polymer
            - conversion_coating
            - inhibitor_film
            - other

        coating_thickness_um:
          type: number
          required: false
          visible_if:
            coated: true

        coating_notes:
          type: textarea
          required: false
          visible_if:
            coated: true

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

    contact:
      contributor_name:
        type: text
        required: true
      contributor_email:
        type: email
        required: true

  ui_logic:
    - show measurement_context.conditional_fields based on measurement_method
    - show charging_context.conditional_fields based on charging_method
    - show coating fields only when coated = true
    - allow per-row overrides collapsed by default
    - keep notes fields available after major "categories" (so materials for example) for uncommon cases
