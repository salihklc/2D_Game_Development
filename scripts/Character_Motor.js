// JavaScript source code
#pragma strict
#pragma implicit
#pragma downcast

// Does this script currently respond to input?
var canControl : boolean = true;

var useFixedUpdate : boolean = true;

// For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
// Very handy for organization!

// The current global direction we want the character to move in.
@System.NonSerialized
var inputMoveDirection : Vector3 = Vector3.zero;

// Is the jump button held down? We use this interface instead of checking
// for the jump button directly so this script can also be used by AIs.
@System.NonSerialized
var inputJump : boolean = false;

class CharacterMotorMovement {
    // The maximum horizontal speed when moving
    var maxForwardSpeed : float = 10.0;
    var maxSidewaysSpeed : float = 10.0;
    var maxBackwardsSpeed : float = 10.0;
	
    // Curve for multiplying speed based on slope (negative = downwards)
    var slopeSpeedMultiplier : AnimationCurve = AnimationCurve(Keyframe(-90, 1), Keyframe(0, 1), Keyframe(90, 0));
	
    // How fast does the character change speeds?  Higher is faster.
    var maxGroundAcceleration : float = 30.0;
    var maxAirAcceleration : float = 20.0;

    // The gravity for the character
    var gravity : float = 10.0;
    var maxFallSpeed : float = 20.0;
	
    // For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
    // Very handy for organization!

    // The last collision flags returned from controller.Move
	@System.NonSerialized
    var collisionFlags : CollisionFlags; 

    // We will keep track of the character's current velocity,
	@System.NonSerialized
    var velocity : Vector3;
	
    // This keeps track of our current velocity while we're not grounded
	@System.NonSerialized
    var frameVelocity : Vector3 = Vector3.zero;
	
	@System.NonSerialized
    var hitPoint : Vector3 = Vector3.zero;
	
	@System.NonSerialized
    var lastHitPoint : Vector3 = Vector3(Mathf.Infinity, 0, 0);
}

var movement : CharacterMotorMovement = CharacterMotorMovement();

enum MovementTransferOnJump {
    None, // The jump is not affected by velocity of floor at all.
	InitTransfer, // Jump gets its initial velocity from the floor, then gradualy comes to a stop.
	PermaTransfer, // Jump gets its initial velocity from the floor, and keeps that velocity until landing.
	PermaLocked // Jump is relative to the movement of the last touched floor and will move together with that floor.
}

// We will contain all the jumping related variables in one helper class for clarity.
class CharacterMotorJumping {
    // Can the character jump?
    var enabled : boolean = true;

    // How high do we jump when pressing jump and letting go immediately
    var baseHeight : float = 1.0;
	
    // We add extraHeight units (meters) on top when holding the button down longer while jumping
    var extraHeight : float = 4.1;
	
    // How much does the character jump out perpendicular to the surface on walkable surfaces?
    // 0 means a fully vertical jump and 1 means fully perpendicular.
    var perpAmount : float = 0.0;
	
    // How much does the character jump out perpendicular to the surface on too steep surfaces?
    // 0 means a fully vertical jump and 1 means fully perpendicular.
    var steepPerpAmount : float = 0.5;
	
    // For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
    // Very handy for organization!

    // Are we jumping? (Initiated with jump button and not grounded yet)
    // To see if we are just in the air (initiated by jumping OR falling) see the grounded variable.
	@System.NonSerialized
    var jumping : boolean = false;
	
	@System.NonSerialized
    var holdingJumpButton : boolean = false;

    // the time we jumped at (Used to determine for how long to apply extra jump power after jumping.)
	@System.NonSerialized
    var lastStartTime : float = 0.0;
	
	@System.NonSerialized
    var lastButtonDownTime : float = -100;
	
	@System.NonSerialized
    var jumpDir : Vector3 = Vector3.up;
}
