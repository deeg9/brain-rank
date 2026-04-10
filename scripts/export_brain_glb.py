#!/usr/bin/env python3
"""
Export fsaverage5 brain mesh as GLB with named region groups.

Uses nilearn to load the fsaverage5 pial surface and the existing
atlas.py region masks to split the mesh into 5 named submeshes:
  - attention
  - reward
  - emotional_processing
  - social_cognition
  - base (everything not in a named region)

Output: web/public/models/brain-fsaverage5.glb
"""
import os
import sys

import numpy as np
import trimesh

# Add project root to path so we can import region_mapping
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "src"))

from region_mapping.atlas import build_region_masks
from region_mapping.constants import N_VERTICES

OUTPUT_PATH = os.path.join(PROJECT_ROOT, "web", "public", "models", "brain-fsaverage5.glb")
UNIFIED_OUTPUT_PATH = os.path.join(PROJECT_ROOT, "web", "public", "models", "brain-fsaverage5-unified.glb")


def load_fsaverage5():
    """Load fsaverage5 pial surface coordinates and faces."""
    from nilearn.datasets import fetch_surf_fsaverage
    from nilearn.surface import load_surf_mesh

    fsaverage = fetch_surf_fsaverage(mesh="fsaverage5")
    coords_left, faces_left = load_surf_mesh(fsaverage["pial_left"])
    coords_right, faces_right = load_surf_mesh(fsaverage["pial_right"])

    # Combine hemispheres (left first, then right with offset faces)
    coords = np.vstack([coords_left, coords_right])
    faces = np.vstack([faces_left, faces_right + len(coords_left)])

    print(f"Loaded fsaverage5: {len(coords)} vertices, {len(faces)} faces")
    assert len(coords) == N_VERTICES, f"Expected {N_VERTICES} vertices, got {len(coords)}"

    return coords, faces


def extract_submesh(coords, faces, vertex_mask):
    """Extract a submesh for vertices matching the boolean mask."""
    # Find faces where ALL 3 vertices are in the mask
    face_mask = vertex_mask[faces].all(axis=1)
    region_faces = faces[face_mask]

    if len(region_faces) == 0:
        return None

    # Get unique vertices used by these faces
    unique_verts = np.unique(region_faces)
    # Build a vertex index remapping
    remap = np.full(len(coords), -1, dtype=int)
    remap[unique_verts] = np.arange(len(unique_verts))

    new_coords = coords[unique_verts]
    new_faces = remap[region_faces]

    mesh = trimesh.Trimesh(vertices=new_coords, faces=new_faces, process=False)
    trimesh.repair.fix_normals(mesh)
    return mesh


def main():
    print("Loading fsaverage5 surface...")
    coords, faces = load_fsaverage5()

    print("Building region masks...")
    masks = build_region_masks()

    scene = trimesh.Scene()
    combined_mask = np.zeros(N_VERTICES, dtype=bool)

    region_names = ["attention", "reward", "emotional_processing", "social_cognition"]

    for name in region_names:
        mask = masks[name]
        combined_mask |= mask
        submesh = extract_submesh(coords, faces, mask)
        if submesh is not None:
            scene.add_geometry(submesh, node_name=name, geom_name=name)
            print(f"  {name}: {len(submesh.vertices)} vertices, {len(submesh.faces)} faces")
        else:
            print(f"  {name}: WARNING - no faces found")

    # Base mesh: vertices NOT in any region
    base_mask = ~combined_mask
    base_mesh = extract_submesh(coords, faces, base_mask)
    if base_mesh is not None:
        scene.add_geometry(base_mesh, node_name="base", geom_name="base")
        print(f"  base: {len(base_mesh.vertices)} vertices, {len(base_mesh.faces)} faces")

    # Export
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    scene.export(OUTPUT_PATH)

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"\nExported to: {OUTPUT_PATH}")
    print(f"File size: {file_size / 1024:.1f} KB ({file_size / (1024*1024):.2f} MB)")
    print(f"Mesh nodes: {len(scene.geometry)} ({', '.join(scene.geometry.keys())})")


def export_unified_glb():
    """Export a single unified mesh GLB with all 20,484 fsaverage5 vertices.

    Vertex ordering is preserved exactly: left hemisphere 0-10241,
    right hemisphere 10242-20483. This matches TRIBE v2 output indices 1:1,
    enabling direct per-vertex heatmap mapping without index remapping.

    CRITICAL: process=False prevents trimesh from deduplicating vertices
    at hemisphere seams, which would break the vertex-to-index mapping.
    """
    print("\n=== Unified GLB Export ===")
    print("Loading fsaverage5 surface...")
    coords, faces = load_fsaverage5()

    # Create single mesh with process=False to preserve vertex ordering
    unified_mesh = trimesh.Trimesh(vertices=coords, faces=faces, process=False)
    trimesh.repair.fix_normals(unified_mesh)

    # Build scene with named geometry for useGLTF access as nodes.brain
    scene = trimesh.Scene()
    scene.add_geometry(unified_mesh, node_name="brain", geom_name="brain")

    # Export
    os.makedirs(os.path.dirname(UNIFIED_OUTPUT_PATH), exist_ok=True)
    scene.export(UNIFIED_OUTPUT_PATH)

    # Validate
    assert len(unified_mesh.vertices) == N_VERTICES, (
        f"Expected {N_VERTICES} vertices, got {len(unified_mesh.vertices)}"
    )

    file_size = os.path.getsize(UNIFIED_OUTPUT_PATH)
    print(f"Exported to: {UNIFIED_OUTPUT_PATH}")
    print(f"Vertices: {len(unified_mesh.vertices)}")
    print(f"Faces: {len(unified_mesh.faces)}")
    print(f"File size: {file_size / 1024:.1f} KB ({file_size / (1024*1024):.2f} MB)")
    print(f"Mesh nodes: 1 (brain)")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Export fsaverage5 brain meshes as GLB")
    parser.add_argument(
        "--unified-only",
        action="store_true",
        help="Only export the unified single-mesh GLB (skip region-split export)",
    )
    args = parser.parse_args()

    if not args.unified_only:
        main()
    export_unified_glb()
