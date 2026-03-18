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
Here’s how to read that row, in plain terms:

Identifiers

entry_id:   Unique ID for this exact data row (one temperature point or one model fit).
source_id:  The publication (paper) this data comes from.
group_id:   The figure/table or dataset grouping within that source (e.g., “Fig. 8”). It ties multiple rows together.


What varies across rows

variant_key:    The main variable being changed across the group (e.g., “Cr content”).
variant_value:  The specific value for this row (e.g., 0.0).
variant_unit:   Unit for the variant (e.g., at.%).


What defines the series

series_key:     The second dimension (often temperature or processing condition).
series_value:   The label/value for this row in that series (e.g., "45 C").


The data model

model.type =    What kind of data this row represents.
single_point =  one measured diffusivity at one temperature.
arrhenius = a   fitted D0 + Q across a temperature range.
power =         a D = A * x^n style fit.
model.temperature_K:            Temperature for a single point (always stored in K).
model.diffusivity_mm2_per_s:    Diffusivity value (normalized to mm^2/s).


So this row reads as:
From paper bockris_1970..., figure group bockris_1970_fecr_fig8, the variant is Cr content = 0.0 at.%; the series is Temperature = 45 C; and it gives a single-point diffusivity at 318.15 K of 0.002686 mm²/s.

ask this later maybe:

for now im not worried about the readibility, how current database is a mess in that sense anyway. Im ust trying to wrap my head around this.

so the x axis is always temperatre and y is always diffusion coeff. its like a touple we assign (for a single point) or maybe a small table for arrhenious basically. and then these have attributes, like all the stuff "experimental setup" for example. like so and so much Vanadium lets say. And also a paper where they come from, say Denis or what ever. Now Denis might have looked at the effect of the Cr content so he has a table with 3 Cr contents: 1%, 2%, 3% and each gets a D_app value (lets go for single point for now)=
**--------------------------------------------------------------**

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

